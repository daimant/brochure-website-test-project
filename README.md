# Портфолио — Сергей Поморцев

Лендинг-презентация Frontend-разработчика. Содержит информацию об опыте, стеке, подходе к работе, реализованных проектах, форму обратной связи с отправкой email и AI-генерацию примера сообщения прямо в форме.

---

## Стек

| Слой | Технологии |
|---|---|
| Frontend | TypeScript, SCSS, HTML5, Vite |
| Backend | Node.js, Express, TypeScript |
| Email | Nodemailer (SMTP — Gmail / Yandex / любой) |
| AI | OpenRouter API (free-tier LLMs) |
| Сборка | Vite 5 (frontend), tsc (backend) |

---

## Структура проекта

```
brochure-website-test-project/
├── frontend/               # Vite + TypeScript + SCSS
│   ├── index.html          # Разметка всех секций
│   ├── vite.config.ts      # Прокси /api → localhost:3001
│   ├── tsconfig.json
│   └── src/
│       ├── styles/
│       │   ├── main.scss           # Точка входа стилей (@use партиалов)
│       │   ├── _forward.scss       # Центральный форвард переменных для партиалов
│       │   ├── _variables.scss     # Цвета, типографика, миксины
│       │   ├── _reset.scss
│       │   ├── _header.scss        # Sticky nav + гамбургер
│       │   ├── _hero.scss          # Hero + анимация градиента
│       │   ├── _about.scss         # Стек, опыт, направления
│       │   ├── _approach.scss      # Подход + AI в работе
│       │   ├── _cases.scss         # Карточки проектов
│       │   ├── _contact.scss       # Секция контактов
│       │   ├── _form.scss          # Форма со всеми состояниями
│       │   └── _footer.scss
│       └── ts/
│           ├── main.ts             # Точка входа, typewriter, гамбургер
│           ├── form.ts             # Валидация + отправка формы
│           ├── ai-summary.ts       # AI-генерация примера сообщения для формы
│           └── scroll.ts           # IntersectionObserver анимации
└── backend/                # Express + TypeScript
    ├── .env.example        # Шаблон переменных окружения
    ├── tsconfig.json
    └── src/
        ├── index.ts                # Сервер, middleware, роуты
        ├── routes/
        │   ├── contact.ts          # POST /api/contact
        │   └── ai-generate.ts      # POST /api/ai-generate
        └── services/
            └── mailer.ts           # Nodemailer, HTML-шаблоны писем
```

---

## Как запустить

### 1. Backend

```bash
cd backend

# Установить зависимости
yarn

# Настроить окружение
cp .env.example .env
# Заполнить .env: SMTP_*, OWNER_EMAIL, OPENROUTER_API_KEY

# Режим разработки (ts-node-dev с hot reload)
yarn dev

# Production
yarn build && yarn start
```

Backend запустится на `http://localhost:3001`.

#### Переменные окружения (backend)

| Переменная | Обязательна | Описание |
|---|---|---|
| `SMTP_HOST` | да | SMTP-сервер (например, `smtp.gmail.com`) |
| `SMTP_USER` | да | Логин SMTP |
| `SMTP_PASS` | да | Пароль SMTP (или пароль приложения) |
| `OWNER_EMAIL` | да | Email владельца для получения заявок |
| `SMTP_PORT` | нет | Порт SMTP (по умолчанию 587) |
| `SMTP_SECURE` | нет | `true` для порта 465 |
| `OPENROUTER_API_KEY` | нет | Ключ OpenRouter для AI-генерации |
| `ALLOWED_ORIGINS` | нет | Список разрешённых origin через запятую (по умолчанию `http://localhost:5173`) |
| `PORT` | нет | Порт сервера (по умолчанию 3001) |

#### Настройка SMTP (Gmail)
1. Включите двухфакторную аутентификацию в Google-аккаунте
2. Перейдите в «Безопасность» → «Пароли приложений»
3. Создайте пароль для приложения «Почта»
4. Вставьте его в `.env` как `SMTP_PASS`

#### Настройка OpenRouter
1. Зарегистрируйтесь на [openrouter.ai](https://openrouter.ai) (бесплатно, карта не нужна)
2. Получите API-ключ в разделе «Keys»
3. Вставьте в `.env` как `OPENROUTER_API_KEY`
4. Если ключ не указан — кнопка генерации возвращает ошибку, форма работает в штатном режиме

---

### 2. Frontend

```bash
cd frontend

# Установить зависимости
yarn

# Режим разработки (hot reload, прокси /api → :3001)
yarn dev

# Production build
yarn build
yarn preview
```

Frontend доступен на `http://localhost:5173`.

#### Переменные окружения (frontend, опционально)

| Переменная | Описание |
|---|---|
| `VITE_API_URL` | Базовый URL backend (по умолчанию `http://localhost:3001`) |

> Для полной работы формы и AI-генерации нужен запущенный backend.
> В режиме `dev` Vite автоматически проксирует `/api/*` → `localhost:3001`.

---

## Как реализована форма

### Клиент (`src/ts/form.ts`)
1. **Валидация** — проверяются все поля до отправки (имя ≥ 2 символов, телефон по regex, email, сообщение ≥ 10 символов)
2. **Inline-ошибки** — каждое поле получает класс `is-error`, под ним появляется текст ошибки
3. **Loading-state** — кнопка переходит в состояние `is-loading` (spinner), все поля блокируются
4. **Защита от двойной отправки** — флаг `isSubmitting`
5. **Success/Error** — блок-статус под формой с соответствующим стилем

### Сервер (`backend/src/routes/contact.ts`)
1. **Валидация** — `express-validator` (дублирует клиентскую, защита от обхода)
2. **Rate limiting** — max 3 запроса на IP за 15 минут (in-memory)
3. **Отправка** — `mailer.ts` → одновременно два письма:
   - Владельцу: тема «Новая заявка от [имя]», HTML-письмо с тёмной темой
   - Пользователю: тема «Ваша заявка принята», письмо с подтверждением и контактами
4. **XSS-защита** — все пользовательские данные экранируются перед вставкой в HTML писем

---

## AI-интеграция

### Что реализовано

В форме обратной связи есть кнопка **«Сгенерировать пример»**. При нажатии клиент отправляет запрос на backend, который обращается к OpenRouter и возвращает короткий пример сообщения от лица потенциального работодателя. Текст вставляется в поле сообщения.

Если в поле «Имя» уже что-то введено, это имя передаётся как контекст для персонализации генерации.

| Компонент | Роль |
|---|---|
| **`ai-summary.ts`** | Кнопка в форме → запрос к `/api/ai-generate` → вставка текста в textarea |
| **`ai-generate.ts`** | Роут с fallback-перебором моделей OpenRouter (5 моделей, free tier) |
| **Системный промпт** | AI пишет от лица HR, приглашающего разработчика на интервью (2–3 предложения, без приветствий) |
| **Деградация** | Если `OPENROUTER_API_KEY` не задан — возвращается ошибка 503, форма работает в штатном режиме |

### Эндпоинт
```
POST /api/ai-generate
Body: { "context": "Имя отправителя" }   // необязательно
Response: { "success": true, "text": "..." }
```

Используемые модели (с автоматическим fallback при rate-limit):
- `openai/gpt-oss-20b:free`
- `nvidia/nemotron-nano-9b-v2:free`
- `liquid/lfm-2.5-1.2b-instruct:free`
- `google/gemma-4-31b-it:free`
- `meta-llama/llama-3.3-70b-instruct:free`

---

## Какие AI-инструменты использовались

| Инструмент | Применение |
|---|---|
| **Claude Sonnet 4.6 (Zed Agent)** | Проектирование архитектуры, генерация всего frontend и backend кода |
| **OpenRouter (free-tier LLMs)** | Runtime AI-генерация примера сообщения в форме |

### Что делалось с помощью ИИ
- Полный скаффолдинг проекта (структура директорий, конфиги)
- Весь TypeScript-код: scroll-анимации, форма с валидацией, AI-генерация сообщения
- SCSS-архитектура: переменные, миксины, адаптивность, состояния
- HTML-разметка всех секций
- Backend: Express-роуты, валидация, rate limiting, fallback-логика OpenRouter
- HTML-шаблоны писем (owner + user confirmation)
- Nodemailer интеграция
- README

### Что корректировалось вручную
- `.env.example` — добавлены пояснения на русском
- Уточнения контактных данных (Telegram, телефон)
- Финальная проверка сборки и диагностика типов

---

## Дизайн

Тёмная тема в стиле developer-tool:
- Фон: `#0a0e1a` / `#111827`
- Акцент: `#60a5fa` (blue-400) + `#a78bfa` (purple-400)
- Типографика: Inter + JetBrains Mono
- Анимации: IntersectionObserver reveal, typewriter, gradient shift
- `prefers-reduced-motion` — все анимации отключаются при системной настройке

---

## Контакты

- Telegram: [@daimantt](https://t.me/daimantt)
- Телефон: +7(926)66-22-577
