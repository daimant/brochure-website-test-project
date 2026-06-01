# Портфолио — Сергей Поморцев

Лендинг-презентация Frontend-разработчика. Содержит информацию об опыте, стеке, подходе к работе, реализованных проектах, форму обратной связи с отправкой email и AI-ассистента.

---

## Стек

| Слой | Технологии |
|---|---|
| Frontend | TypeScript, SCSS, HTML5, Vite |
| Backend | Node.js, Express, TypeScript |
| Email | Nodemailer (SMTP — Gmail / Yandex / любой) |
| AI | OpenAI API (gpt-4o-mini) |
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
│       │   ├── main.scss           # Импорты
│       │   ├── _variables.scss     # Цвета, типографика, миксины
│       │   ├── _reset.scss
│       │   ├── _header.scss        # Sticky nav + гамбургер
│       │   ├── _hero.scss          # Hero + анимация градиента
│       │   ├── _about.scss         # Стек, опыт, направления
│       │   ├── _approach.scss      # Подход + AI в работе
│       │   ├── _cases.scss         # Карточки проектов
│       │   ├── _contact.scss       # Секция контактов
│       │   ├── _form.scss          # Форма со всеми состояниями
│       │   ├── _ai-widget.scss     # Glassmorphism AI-виджет
│       │   └── _footer.scss
│       └── ts/
│           ├── main.ts             # Точка входа, typewriter, гамбургер
│           ├── form.ts             # Валидация + отправка формы
│           ├── ai-widget.ts        # AI-ассистент
│           └── scroll.ts           # IntersectionObserver анимации
└── backend/                # Express + TypeScript
    ├── .env.example        # Шаблон переменных окружения
    ├── tsconfig.json
    └── src/
        ├── index.ts                # Сервер, middleware, роуты
        ├── routes/
        │   ├── contact.ts          # POST /api/contact
        │   └── ai.ts               # POST /api/ai/generate
        └── services/
            ├── mailer.ts           # Nodemailer, HTML-шаблоны писем
            └── aiService.ts        # OpenAI SDK wrapper
```

---

## Как запустить

### 1. Backend

```bash
cd backend

# Установить зависимости
npm install

# Настроить окружение
cp .env.example .env
# Заполнить .env: SMTP_*, OWNER_EMAIL, OPENAI_API_KEY

# Режим разработки (ts-node-dev с hot reload)
npm run dev

# Production
npm run build && npm start
```

Backend запустится на `http://localhost:3001`.

#### Настройка SMTP (Gmail)
1. Включите двухфакторную аутентификацию в Google-аккаунте
2. Перейдите в «Безопасность» → «Пароли приложений»
3. Создайте пароль для приложения «Почта»
4. Вставьте его в `.env` как `SMTP_PASS`

#### Настройка OpenAI
1. Получите API-ключ на [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Вставьте в `.env` как `OPENAI_API_KEY`
3. Если ключ не указан — AI-виджет возвращает заглушку, форма работает в штатном режиме

---

### 2. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Режим разработки (hot reload, прокси /api → :3001)
npm run dev

# Production build
npm run build
npm run preview
```

Frontend доступен на `http://localhost:5173`.

> Для полной работы формы и AI-виджета нужен запущенный backend.
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

| Компонент | Роль AI |
|---|---|
| **AI-виджет на сайте** | Пользователь задаёт вопрос об опыте разработчика → OpenAI генерирует ответ от лица ассистента портфолио |
| **Системный промпт** | Ограничивает AI темой: Vue, React, TypeScript, проекты e.pn / dv.net / sx.org; при посторонних вопросах вежливо возвращает к профессиональным темам |
| **Деградация** | Если `OPENAI_API_KEY` не задан — виджет возвращает сообщение «Функция недоступна», сайт работает в штатном режиме |

### Эндпоинт
```
POST /api/ai/generate
Body: { "question": "Какой опыт с React?" }
Response: { "success": true, "response": "..." }
```

Rate limit: 10 запросов на IP в минуту.

---

## Какие AI-инструменты использовались

| Инструмент | Применение |
|---|---|
| **Claude Sonnet 4.6 (Zed Agent)** | Проектирование архитектуры, генерация всего frontend и backend кода |
| **OpenAI API (gpt-4o-mini)** | Runtime AI-ассистент в виджете на сайте |

### Что делалось с помощью ИИ
- Полный скаффолдинг проекта (структура директорий, конфиги)
- Весь TypeScript-код: scroll-анимации, форма с валидацией, AI-виджет
- SCSS-архитектура: переменные, миксины, адаптивность, состояния
- HTML-разметка всех секций
- Backend: Express-роуты, валидация, rate limiting
- HTML-шаблоны писем (owner + user confirmation)
- Nodemailer и OpenAI SDK интеграция
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
