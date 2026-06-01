import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail, ContactFormData } from '../services/mailer';

const router = Router();

// ---------------------------------------------------------------------------
// In-memory rate limiter
// ---------------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const contactRateStore = new Map<string, RateLimitRecord>();
const CONTACT_MAX_REQUESTS = 3;
const CONTACT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function contactRateLimiter(req: Request, res: Response, next: () => void): void {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  const now = Date.now();
  const record = contactRateStore.get(ip);

  if (!record || now >= record.resetAt) {
    contactRateStore.set(ip, { count: 1, resetAt: now + CONTACT_WINDOW_MS });
    next();
    return;
  }

  if (record.count >= CONTACT_MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      success: false,
      message: `Слишком много запросов. Повторите через ${Math.ceil(retryAfterSec / 60)} мин.`,
    });
    return;
  }

  record.count += 1;
  next();
}

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
const contactValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Имя обязательно.')
    .isString().withMessage('Имя должно быть строкой.')
    .isLength({ min: 2 }).withMessage('Имя должно содержать не менее 2 символов.'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Телефон обязателен.')
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Введите корректный номер телефона.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email обязателен.')
    .isEmail().withMessage('Введите корректный email.')
    .normalizeEmail(),

  body('message')
    .trim()
    .notEmpty().withMessage('Сообщение обязательно.')
    .isString().withMessage('Сообщение должно быть строкой.')
    .isLength({ min: 10 }).withMessage('Сообщение должно содержать не менее 10 символов.'),
];

// ---------------------------------------------------------------------------
// POST /api/contact
// ---------------------------------------------------------------------------
router.post(
  '/',
  contactRateLimiter,
  contactValidators,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Пожалуйста, исправьте ошибки в форме.',
        errors: errors.array().map((e) => ({
          field: e.type === 'field' ? e.path : undefined,
          message: e.msg,
        })),
      });
      return;
    }

    const data: ContactFormData = {
      name: req.body.name as string,
      phone: req.body.phone as string,
      email: req.body.email as string,
      message: req.body.message as string,
    };

    try {
      await sendContactEmail(data);
      console.log(`[contact] Email sent for "${data.name}" <${data.email}>`);
      res.status(200).json({
        success: true,
        message: 'Ваше сообщение отправлено!',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[contact] Failed to send email: ${message}`);
      res.status(500).json({
        success: false,
        message: 'Ошибка отправки. Попробуйте ещё раз.',
      });
    }
  },
);

export default router;
