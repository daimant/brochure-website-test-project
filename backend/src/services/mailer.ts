import nodemailer, { Transporter } from 'nodemailer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Transporter factory
// ---------------------------------------------------------------------------
function createTransporter(): Transporter {
  const smtpPort = Number(process.env['SMTP_PORT']) || 587;
  const smtpSecure = process.env['SMTP_SECURE'] === 'true';

  return nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  });
}

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------
function buildOwnerEmailHtml(data: ContactFormData, timestamp: string): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Новая заявка</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #e6edf3; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1f6feb 0%, #388bfd 100%); padding: 32px 40px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
    .header p { margin-top: 6px; font-size: 14px; color: rgba(255,255,255,0.8); }
    .body { padding: 32px 40px; }
    .field { margin-bottom: 24px; }
    .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #8b949e; margin-bottom: 6px; }
    .field-value { font-size: 15px; color: #e6edf3; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px; line-height: 1.5; word-break: break-word; }
    .field-value a { color: #388bfd; text-decoration: none; }
    .field-value.message { white-space: pre-wrap; }
    .divider { border: none; border-top: 1px solid #21262d; margin: 8px 0 24px; }
    .footer { padding: 20px 40px; border-top: 1px solid #21262d; font-size: 12px; color: #8b949e; text-align: center; }
    .badge { display: inline-block; background: #1f6feb22; color: #388bfd; border: 1px solid #1f6feb55; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📬 Новая заявка с сайта</h1>
      <p>${timestamp}</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="field-label">Имя</div>
        <div class="field-value">${escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Телефон</div>
        <div class="field-value">
          <a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">
          <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>
        </div>
      </div>
      <hr class="divider" />
      <div class="field">
        <div class="field-label">Сообщение</div>
        <div class="field-value message">${escapeHtml(data.message)}</div>
      </div>
    </div>
    <div class="footer">
      <span class="badge">portfolio-backend</span>&nbsp;&nbsp;Это автоматическое уведомление
    </div>
  </div>
</body>
</html>
`.trim();
}

function buildOwnerEmailText(data: ContactFormData, timestamp: string): string {
  return [
    `Новая заявка с сайта — ${timestamp}`,
    '',
    `Имя:     ${data.name}`,
    `Телефон: ${data.phone}`,
    `Email:   ${data.email}`,
    '',
    'Сообщение:',
    data.message,
  ].join('\n');
}

function buildUserConfirmationHtml(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Заявка принята</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #e6edf3; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #238636 0%, #2ea043 100%); padding: 32px 40px; text-align: center; }
    .header .icon { font-size: 48px; margin-bottom: 16px; }
    .header h1 { font-size: 24px; font-weight: 700; color: #ffffff; }
    .header p { margin-top: 8px; font-size: 15px; color: rgba(255,255,255,0.85); }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; font-weight: 600; color: #e6edf3; margin-bottom: 16px; }
    .text { font-size: 15px; color: #8b949e; line-height: 1.7; margin-bottom: 16px; }
    .text strong { color: #e6edf3; }
    .summary { background: #0d1117; border: 1px solid #30363d; border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .summary-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #8b949e; margin-bottom: 14px; }
    .summary-row { display: flex; gap: 12px; margin-bottom: 10px; font-size: 14px; }
    .summary-row:last-child { margin-bottom: 0; }
    .summary-key { color: #8b949e; min-width: 80px; flex-shrink: 0; }
    .summary-val { color: #e6edf3; word-break: break-word; }
    .contacts { margin-top: 28px; padding-top: 24px; border-top: 1px solid #21262d; }
    .contacts-title { font-size: 13px; font-weight: 600; color: #8b949e; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.8px; }
    .contact-link { display: inline-block; margin-right: 16px; margin-bottom: 8px; font-size: 14px; color: #388bfd; text-decoration: none; }
    .footer { padding: 20px 40px; border-top: 1px solid #21262d; font-size: 12px; color: #8b949e; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Заявка принята!</h1>
      <p>Я свяжусь с вами в ближайшее время</p>
    </div>
    <div class="body">
      <div class="greeting">Привет, ${escapeHtml(data.name)}!</div>
      <p class="text">
        Спасибо за ваше сообщение. Я его получил и постараюсь ответить
        <strong>в течение 24 часов</strong> в рабочие дни.
      </p>
      <p class="text">
        Если у вас срочный вопрос — напишите напрямую на почту или в Telegram.
      </p>

      <div class="summary">
        <div class="summary-title">Ваша заявка</div>
        <div class="summary-row">
          <span class="summary-key">Имя</span>
          <span class="summary-val">${escapeHtml(data.name)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-key">Телефон</span>
          <span class="summary-val">${escapeHtml(data.phone)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-key">Email</span>
          <span class="summary-val">${escapeHtml(data.email)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-key">Сообщение</span>
          <span class="summary-val">${escapeHtml(data.message)}</span>
        </div>
      </div>

      <div class="contacts">
        <div class="contacts-title">Связаться напрямую</div>
        <a class="contact-link" href="mailto:${escapeHtml(process.env['OWNER_EMAIL'] ?? '')}">
          📧 ${escapeHtml(process.env['OWNER_EMAIL'] ?? 'your@gmail.com')}
        </a>
        <a class="contact-link" href="https://t.me/sergeypomortsev">
          ✈️ Telegram
        </a>
      </div>
    </div>
    <div class="footer">
      С уважением,<br />
      <strong style="color:#e6edf3;">Сергей Поморцев</strong> — Frontend Developer<br />
      Екатеринбург, Россия
    </div>
  </div>
</body>
</html>
`.trim();
}

function buildUserConfirmationText(data: ContactFormData): string {
  return [
    `Привет, ${data.name}!`,
    '',
    'Спасибо за ваше сообщение. Я его получил и постараюсь ответить в течение 24 часов в рабочие дни.',
    '',
    'Детали вашей заявки:',
    `  Имя:       ${data.name}`,
    `  Телефон:   ${data.phone}`,
    `  Email:     ${data.email}`,
    `  Сообщение: ${data.message}`,
    '',
    'Если у вас срочный вопрос — напишите напрямую:',
    `  Email:    ${process.env['OWNER_EMAIL'] ?? 'your@gmail.com'}`,
    '  Telegram: https://t.me/sergeypomortsev',
    '',
    'С уважением,',
    'Сергей Поморцев — Frontend Developer',
    'Екатеринбург, Россия',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimestamp(): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
    timeZoneName: 'short',
  }).format(new Date());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify SMTP connection. Throws if the connection cannot be established.
 */
export async function verifyMailer(): Promise<void> {
  const transporter = createTransporter();
  await transporter.verify();
}

/**
 * Send a notification email to the site owner and a confirmation email to the
 * person who filled out the contact form.
 */
export async function sendContactEmail(data: ContactFormData): Promise<void> {
  const transporter = createTransporter();

  // Fail fast if SMTP is unreachable
  await transporter.verify();

  const ownerEmail = process.env['OWNER_EMAIL'];
  if (!ownerEmail) {
    throw new Error('OWNER_EMAIL environment variable is not set.');
  }

  const senderAddress = `"Сергей Поморцев — Portfolio" <${process.env['SMTP_USER']}>`;
  const timestamp = formatTimestamp();

  // 1. Notify the owner
  await transporter.sendMail({
    from: senderAddress,
    to: ownerEmail,
    replyTo: data.email,
    subject: `Новая заявка от ${data.name}`,
    text: buildOwnerEmailText(data, timestamp),
    html: buildOwnerEmailHtml(data, timestamp),
  });

  // 2. Confirmation to the user
  await transporter.sendMail({
    from: senderAddress,
    to: data.email,
    subject: 'Ваша заявка принята | Сергей Поморцев',
    text: buildUserConfirmationText(data),
    html: buildUserConfirmationHtml(data),
  });
}
