# 📚 Documentation Index

Все документы проекта находятся здесь.

## 📋 Содержание

### 🔍 Аудит и безопасность
- **[ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md](./ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md)** — Полный аудит проекта с 30+ идеями улучшений
- **[AUDIT_LOG_GUIDE.md](./AUDIT_LOG_GUIDE.md)** — Руководство по системе аудит логирования
- **[AUDIT_DEPLOYMENT_CHECKLIST.md](./AUDIT_DEPLOYMENT_CHECKLIST.md)** — Чек-лист развёртывания audit_log

### ⚙️ Инфраструктура
- **[INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)** — Setup для Email, Rate Limiting, Logging, Sentry

### 👥 Для разработчиков
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Как добавлять документацию в проект

---

## 🎯 Быстрый старт

**Новичок в проекте?**
1. Начни с [ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md](./ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md)
2. Прочитай [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)
3. Если нужна аудит система — [AUDIT_DEPLOYMENT_CHECKLIST.md](./AUDIT_DEPLOYMENT_CHECKLIST.md)

**Нужна помощь с конкретной фичей?**
- Email → [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md#-email-setup)
- Rate Limiting → [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md#-rate-limiting-setup)
- Логирование → [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md#-logging-setup)
- Sentry → [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md#-sentry-setup-error-tracking)
- Audit Log → [AUDIT_LOG_GUIDE.md](./AUDIT_LOG_GUIDE.md)

---

## 📝 Структура документов

```
docs/
├── README.md                                  ← Вы здесь
├── ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md        ← Аудит проекта
├── INFRASTRUCTURE_SETUP.md                   ← Email, Rate Limit, Logging, Sentry
├── AUDIT_LOG_GUIDE.md                       ← Аудит система (детально)
└── AUDIT_DEPLOYMENT_CHECKLIST.md            ← Как развернуть audit_log
```

---

## 🚀 Последние добавления

### 2026-05-05
✅ **Email + Rate Limiting + Logging + Sentry инфраструктура**
- 4 провайдера для email (Mailgun, SendGrid, Resend, SMTP)
- Rate limiting protection для API
- Логирование с уровнями (debug, info, warn, error)
- Sentry для tracking ошибок в production

✅ **Полная система аудит логирования**
- Автоматическое логирование всех изменений в БД
- Триггеры на критичные таблицы (transactions, ratings, tasks, profiles)
- TypeScript сервис для работы с логами
- API endpoints для запроса истории

---

## 💾 Как добавлять документацию

**Впредь все документы кладутся в папку `docs/`:**

```bash
# Например, создавая документацию по новой фиче
touch docs/FEATURE_NAME.md
```

**Затем обновляй индекс (`docs/README.md`) с ссылкой на новый документ.**

---

## 📖 Рекомендуемый порядок чтения

1. **[ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md](./ПОЛНЫЙ_АУДИТ_ПРОЕКТА_DELIV-EM.md)** (30 мин)
   - Обзор проекта и всех проблем
   
2. **[INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)** (20 мин)
   - Email, логирование, мониторинг
   
3. **[AUDIT_DEPLOYMENT_CHECKLIST.md](./AUDIT_DEPLOYMENT_CHECKLIST.md)** (15 мин)
   - Как развернуть audit_log
   
4. **[AUDIT_LOG_GUIDE.md](./AUDIT_LOG_GUIDE.md)** (25 мин)
   - Подробные примеры использования audit_log

**Всего: ~90 минут для полного понимания инфраструктуры** 📚

---

Last updated: 2026-05-05
