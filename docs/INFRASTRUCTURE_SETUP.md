# Infrastructure Setup Guide

Это руководство содержит инструкции по настройке всех инфраструктурных сервисов (Email, Logging, Rate Limiting, Sentry).

## 📧 Email Setup

### Выбираем провайдера

В проекте поддерживаются 4 типа отправки email:

**1. Mailgun (рекомендуется для production)**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=your_domain_here  # например: mg.delivem.ru
```
[Получить ключ на mailgun.com](https://mailgun.com)

**2. SendGrid**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key_here
```
[Получить ключ на sendgrid.com](https://sendgrid.com)

**3. Resend (новый, удобный сервис)**
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_api_key_here
```
[Получить ключ на resend.com](https://resend.com)

**4. SMTP (для локального тестирования)**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=  # опционально
SMTP_PASSWORD=  # опционально
```

### Использование в коде

```typescript
import { sendEmail, emailTemplates } from '@/lib/services/email'

// Отправка письма восстановления пароля
const resetTemplate = emailTemplates.passwordReset(resetUrl, userName)
await sendEmail({
  to: userEmail,
  subject: resetTemplate.subject,
  html: resetTemplate.html,
  text: resetTemplate.text,
})

// Доступные шаблоны:
// - passwordReset(url, name)
// - confirmation(url, name)
// - notification(title, message, details)
// - feedback(name, email, message)
```

---

## 🔐 Rate Limiting Setup

Защита API от спама и DDoS атак.

```env
RATE_LIMIT_WINDOW=900      # временное окно в секундах (900 = 15 минут)
RATE_LIMIT_MAX_REQUESTS=100  # максимум запросов за окно
```

### Использование в коде

```typescript
import { checkRateLimit, getClientIp } from '@/lib/middleware/rateLimiter'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(`feedback:${ip}`)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Слишком много запросов' },
      { status: 429 }
    )
  }

  // Обработка запроса...
}
```

---

## 📝 Logging Setup

Логирование с разными уровнями детализации.

```env
LOG_LEVEL=info  # debug | info | warn | error
```

### Использование в коде

```typescript
import { logger } from '@/lib/services/logger'

logger.debug('Debug информация', { data: 'value' })
logger.info('Информационное сообщение', { userId: 123 })
logger.warn('Предупреждение', { issue: 'description' })
logger.error('Ошибка', error)
```

### Уровни логирования

- **debug**: все сообщения (для разработки)
- **info**: информационные, предупреждения и ошибки (по умолчанию)
- **warn**: только предупреждения и ошибки
- **error**: только ошибки

---

## 🚨 Sentry Setup (Error Tracking)

Отслеживание ошибок в production.

```env
SENTRY_DSN=https://your_key@your_org.ingest.sentry.io/your_project_id
```

[Создать проект на sentry.io](https://sentry.io)

### Использование в коде

```typescript
import { captureException, captureMessage } from '@/lib/sentry'

try {
  // код
} catch (error) {
  captureException(error, { context: 'important context' })
}

captureMessage('Important event happened', 'warning')
```

---

## 🧪 Локальное тестирование

### 1. Тестирование Email локально

Используй Mailhog для локального тестирования:

```bash
# Установка через Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Настройка .env
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025

# Проверка писем
# Открой http://localhost:8025
```

### 2. Тестирование Rate Limiting

```bash
# Отправь 101+ запрос за 15 минут
for i in {1..105}; do
  curl -X POST http://localhost:3000/api/feedback \
    -H "Content-Type: application/json" \
    -d '{"name":"test","email":"test@example.com","message":"test"}'
done

# На 101-м запросе получишь 429 ошибку
```

### 3. Проверка Логирования

```bash
# В .env установи
LOG_LEVEL=debug

# Запусти приложение и смотри логи в консоли
npm run dev
```

---

## ✅ Чек-лист для production

- [ ] Выбрал email провайдера
- [ ] Добавил API ключи в .env
- [ ] Протестировал отправку писем
- [ ] Настроил LOG_LEVEL (info для production)
- [ ] Создал проект на Sentry и добавил DSN
- [ ] Установил RATE_LIMIT_WINDOW и MAX_REQUESTS
- [ ] Протестировал все API endpoints

---

## 🆘 Troubleshooting

**Email не отправляется**
- Проверь что EMAIL_PROVIDER указан правильно
- Убедись что API ключ корректный
- Смотри логи: `LOG_LEVEL=debug`

**Sentry не ловит ошибки**
- Убедись что SENTRY_DSN установлен
- Проверь что проект создан в Sentry
- Ошибки отправляются только на production (NODE_ENV=production)

**Rate limiting срабатывает на локальной разработке**
- Уменьши RATE_LIMIT_MAX_REQUESTS
- Или увеличь RATE_LIMIT_WINDOW
