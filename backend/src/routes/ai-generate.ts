import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";

const router = Router();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Fallback list: if a model is rate-limited (429), the next one is tried.
// Diversified across providers to avoid cascading rate-limits.
// All are free-tier models on OpenRouter (no credit card required).
const MODELS = [
  "openai/gpt-oss-20b:free", // OpenAI open-source 20B
  "nvidia/nemotron-nano-9b-v2:free", // NVIDIA 9B — separate provider
  "liquid/lfm-2.5-1.2b-instruct:free", // Liquid AI 1.2B — fast
  "google/gemma-4-31b-it:free", // Google Gemma 4 31B
  "meta-llama/llama-3.3-70b-instruct:free", // Meta 70B — popular, often rate-limited
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const validateBody = [
  body("context").optional().isString().trim().isLength({ max: 100 }),
];

// ---------------------------------------------------------------------------
// Helper: call OpenRouter with one specific model
// ---------------------------------------------------------------------------
interface OpenRouterResponse {
  choices?: Array<{ message: { content: string } }>;
  error?: { message: string; code?: number };
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<
  { ok: true; text: string } | { ok: false; status: number; body: string }
> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "Portfolio Contact Form",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 200,
      temperature: 0.85,
    }),
  });

  const rawBody = await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, body: rawBody };
  }

  let data: OpenRouterResponse;
  try {
    data = JSON.parse(rawBody) as OpenRouterResponse;
  } catch {
    return { ok: false, status: 502, body: rawBody };
  }

  if (data.error) {
    return { ok: false, status: 502, body: data.error.message };
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return { ok: false, status: 502, body: "empty response" };
  }

  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// POST /api/ai-generate
// ---------------------------------------------------------------------------
router.post(
  "/",
  validateBody,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ success: false, message: "Некорректный запрос." });
      return;
    }

    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) {
      console.error("[ai-generate] OPENROUTER_API_KEY is not set");
      res.status(503).json({
        success: false,
        message: "AI-сервис не настроен. Задайте OPENROUTER_API_KEY.",
      });
      return;
    }

    const context = ((req.body as { context?: string }).context ?? "").trim();

    const systemPrompt = [
      "Ты — HR, который посетил сайт-портфолио веб-разработчика и хотел бы пригласить его на интервью.",
      "Напиши короткое (2–3 предложения), профессиональное сообщение на русском языке.",
      "Не добавляй приветствие, прощание или подпись — только тело сообщения.",
    ].join(" ");

    const userPrompt = context
      ? `Составь пример сообщения от лица клиента по имени ${context}, которому нужна разработка веб-проекта.`
      : "Составь пример сообщения от лица клиента, которому нужна разработка веб-проекта.";

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let lastError = "";

    for (const model of MODELS) {
      try {
        const result = await callOpenRouter(apiKey, model, messages);

        if (result.ok) {
          console.log(
            `[ai-generate] model="${model}" generated ${result.text.length} chars` +
              (context ? ` for "${context}"` : ""),
          );
          res.json({ success: true, text: result.text });
          return;
        }

        lastError = result.body;

        // Stop only on auth / bad-request errors; retry on 429, 502, 503, etc.
        const FATAL_STATUSES = [400, 401, 403, 422];
        if (FATAL_STATUSES.includes(result.status)) {
          console.error(
            `[ai-generate] model="${model}" fatal error ${result.status}:`,
            result.body,
          );
          break;
        }

        const label =
          result.status === 429 ? "rate-limited" : `error ${result.status}`;
        console.warn(`[ai-generate] model="${model}" ${label}, trying next...`);
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[ai-generate] model="${model}" fetch error:`, lastError);
        // Network errors are transient — try the next model
      }
    }

    console.error("[ai-generate] All models failed. Last error:", lastError);
    res.status(502).json({
      success: false,
      message: "Ошибка AI-сервиса. Попробуйте позже.",
    });
  },
);

export default router;
