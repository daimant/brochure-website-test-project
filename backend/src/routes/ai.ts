import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { generateText } from '../services/aiService';

const router = Router();

// ---------------------------------------------------------------------------
// In-memory rate limiter
// ---------------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const aiRateStore = new Map<string, RateLimitRecord>();
const AI_MAX_REQUESTS = 10;
const AI_WINDOW_MS = 60 * 1000; // 1 minute

function aiRateLimiter(req: Request, res: Response, next: () => void): void {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  const now = Date.now();
  const record = aiRateStore.get(ip);

  if (!record || now >= record.resetAt) {
    aiRateStore.set(ip, { count: 1, resetAt: now + AI_WINDOW_MS });
    next();
    return;
  }

  if (record.count >= AI_MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      success: false,
      message: `Слишком много запросов. Повторите через ${retryAfterSec} сек.`,
    });
    return;
  }

  record.count += 1;
  next();
}

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
const aiValidators = [
  body('question')
    .trim()
    .notEmpty().withMessage('Вопрос обязателен.')
    .isString().withMessage('Вопрос должен быть строкой.')
    .isLength({ min: 3 }).withMessage('Вопрос должен содержать не менее 3 символов.')
    .isLength({ max: 500 }).withMessage('Вопрос не должен превышать 500 символов.'),
];

// ---------------------------------------------------------------------------
// POST /api/ai/generate
// ---------------------------------------------------------------------------
router.post(
  '/generate',
  aiRateLimiter,
  aiValidators,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Пожалуйста, исправьте ошибки в запросе.',
        errors: errors.array().map((e) => ({
          field: e.type === 'field' ? e.path : undefined,
          message: e.msg,
        })),
      });
      return;
    }

    const question = req.body.question as string;

    try {
      const response = await generateText(question);
      console.log(`[ai] Generated response for question (${question.length} chars)`);
      res.status(200).json({
        success: true,
        response,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ai] Generation failed: ${message}`);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить ответ от AI.',
      });
    }
  },
);

export default router;
