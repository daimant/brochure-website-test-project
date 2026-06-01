import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Ты — AI-ассистент портфолио Сергея Поморцева, frontend-разработчика из Екатеринбурга с 5+ годами опыта. Отвечай кратко (2-4 предложения), информативно и на русском языке. Основной стек: Vue 3, Pinia, React, Redux, TypeScript. Проекты: e.pn (сервис электронных карт), dv.net (криптомерчант), sx.org (маркетплейс прокси). Если спрашивают о чём-то не связанном с профессиональной деятельностью — вежливо переадресуй на профессиональные темы.`;

const MOCK_RESPONSE =
  'AI-функция недоступна. Пожалуйста, свяжитесь напрямую через форму.';

// ---------------------------------------------------------------------------
// Lazy client — created once on first use
// ---------------------------------------------------------------------------
let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey || apiKey === 'sk-...') {
    return null;
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a short AI response for the given question using the portfolio
 * assistant system prompt.
 *
 * Returns a mock string when OPENAI_API_KEY is not configured.
 */
export async function generateText(question: string): Promise<string> {
  const openai = getClient();

  if (!openai) {
    console.warn('[aiService] OPENAI_API_KEY is not set — returning mock response.');
    return MOCK_RESPONSE;
  }

  const model = process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini';

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    return content.trim();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[aiService] OpenAI request failed: ${message}`);
    throw new Error('Failed to get a response from the AI service.');
  }
}
