# Deliv'em

P2P delivery and task service for the Republic of Abkhazia. Customers post delivery tasks; couriers browse, accept, and complete them.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Vercel

---

## Quick Start

```bash
cd delivem-web
cp .env.example .env.local
# Fill in your Supabase + AnyPay credentials (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create `delivem-web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# AnyPay payment gateway (optional — demo mode works without it)
ANYPAY_MERCHANT_ID=<your-merchant-id>
ANYPAY_SECRET_KEY=<your-secret-key>
ANYPAY_API_KEY=<your-api-key>
```

---

## Supabase Setup

### 1. Create a project

Go to [supabase.com](https://supabase.com), create a new project, and copy the URL and keys into `.env.local`.

### 2. Run the schema

In the Supabase SQL editor, run the full schema from:

```
delivem_schema.sql   (project root)
```

This creates all tables, enums, RLS policies, and triggers.

### 3. Enable Storage

In Supabase → Storage, create a public bucket named **`avatars`**.

Set the following storage policies:

```sql
-- Allow authenticated users to upload their own avatar
create policy "Users upload own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read
create policy "Public avatar read"
on storage.objects for select
to public
using (bucket_id = 'avatars');
```

### 4. Enable Realtime

In Supabase → Database → Replication, enable replication for the **`messages`** table (used for real-time chat).

### 5. Auth settings

In Supabase → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000` (dev) / your Vercel URL (prod)
- **Redirect URLs:** add `http://localhost:3000/**` and `https://your-app.vercel.app/**`

---

## Vercel Deployment

```bash
npm i -g vercel
vercel --cwd delivem-web
```

Or connect the repo in the [Vercel dashboard](https://vercel.com/new) and set the **Root Directory** to `delivem-web`.

Add all environment variables from `.env.local` in **Project → Settings → Environment Variables**.

### AnyPay Webhook

After deploying, configure the AnyPay webhook URL in your AnyPay merchant dashboard:

```
https://your-app.vercel.app/api/anypay/webhook
```

---

## Project Structure

```
delivem-web/
├── src/
│   ├── app/
│   │   ├── (auth)/auth/        # Login / register page
│   │   └── (app)/              # Protected app shell
│   │       ├── layout.tsx      # Sidebar + Topbar + BottomNav
│   │       ├── dashboard/      # Role-based dashboard
│   │       ├── tasks/          # Task feed + detail + create
│   │       ├── orders/         # Completed/cancelled history
│   │       ├── messages/       # Chat list + real-time chat
│   │       ├── couriers/       # Courier directory (customers only)
│   │       ├── favorites/      # Saved couriers / customers
│   │       ├── wallet/         # Balance + top-up + transactions
│   │       ├── profile/        # Edit profile + avatar upload
│   │       ├── about/          # About the service
│   │       └── contacts/       # Feedback form
│   ├── components/
│   │   ├── layout/             # Sidebar, Topbar, BottomNav
│   │   ├── tasks/              # TaskCard, RatingModal
│   │   └── ui/                 # Avatar, Badge, Toast, Modal
│   └── lib/
│       ├── supabase/           # server.ts + client.ts
│       ├── types.ts            # DB interfaces + enums + meta maps
│       └── utils.ts
├── .env.example
└── README.md
```

---

## User Roles

| Feature | Customer | Courier |
|---------|----------|---------|
| Create tasks | ✓ | — |
| Browse task feed | — | ✓ |
| Accept / complete tasks | — | ✓ |
| View couriers directory | ✓ | — |
| Top up wallet | ✓ | — |
| Receive reward payout | — | ✓ |
| Real-time chat | ✓ | ✓ |
| Rate after completion | ✓ | ✓ |

---

## Payment Flow (AnyPay)

1. Customer tops up wallet → `POST /api/anypay/webhook` receives confirmation
2. Webhook verifies MD5 signature, credits balance
3. Customer creates task → 100₽ commission deducted from balance
4. Courier completes task → `reward` transferred from customer to courier balance

In demo mode (no AnyPay credentials), top-up directly credits the balance for testing.

---

## Changelog

### 2026-04-14 (5)
Страница создания поручения (`tasks/create`): 1) Иконки типов поручений теперь темно-синие (`#00236f`) в светлой теме и белые в тёмной — задаются через CSS-классы `.type-btn-icon` и `[data-theme="dark"] .type-btn-icon`, цвета из `meta.color` больше не применяются к иконкам на этой странице. 2) Блок адресов разделён на два независимых модуля «Откуда забрать» и «Куда доставить» — каждый содержит поле ввода адреса и область-заглушку карты: если адрес введён, отображается иконка булавки/флага с текстом адреса; если пусто — иконка «нажмите на карту». 3) Нативный `<input type="datetime-local">` заменён кастомным компонентом `DateTimePicker` (`src/components/ui/DateTimePicker.tsx`): полноширинный триггер, выпадающий календарь с навигацией по месяцам, понедельниковое начало недели, подсветка сегодняшнего дня и выбранной даты, встроенный выбор часов/минут, кнопки «Сегодня», «Удалить», «Готово», поддержка тёмной/светлой темы через CSS-переменные. 4) Глобально убраны стрелки-спиннеры у всех `<input type="number">` через CSS (webkit и moz) — затронуты страницы `tasks/create`, `wallet`, `tasks FeedFilters`.
---
Task creation page (`tasks/create`): 1) Task type icons are now dark navy (#00236f) in light theme and white in dark theme — controlled via CSS classes `.type-btn-icon` / `[data-theme="dark"] .type-btn-icon`, no longer inheriting per-type `meta.color`. 2) Address block split into two independent modules "Pick up from" and "Deliver to" — each has an address input and a map placeholder area: shows a pin/flag icon with the entered address when filled, or a "tap to set on map" prompt when empty. 3) Native `<input type="datetime-local">` replaced with custom `DateTimePicker` component (`src/components/ui/DateTimePicker.tsx`): full-width trigger, dropdown calendar with month navigation, Monday-first weekday grid, today highlight, selected day highlight, hour/minute selects, "Today", "Clear", and "Done" buttons, full dark/light theme support via CSS variables. 4) Globally removed spinner arrows from all `<input type="number">` fields via CSS (webkit + moz) — affects `tasks/create`, `wallet`, `tasks FeedFilters` pages.
==============

### 2026-04-13 22:xx
Исправлена загрузка шрифта Material Symbols Outlined — иконки теперь отображаются корректно через `<link>` в `<head>`. Добавлена тёмная тема с переключателем в хедере (сохраняется в localStorage). Все цвета переведены на CSS-переменные. Обновлён дашборд: убран блок «Новое поручение», добавлена кнопка «Смотреть» на карточке «Выполнено всего» (→ `/orders?filter=completed`), добавлены анимации появления карточек и hover-эффект. Тонкие контуры на всех карточках, инпутах и модалках. В хедере добавлено имя пользователя рядом с аватаркой, иконки чата и уведомлений получили активное состояние с badge. Убрана мобильная навигация BottomNav из layout (компонент сохранён).
---
Fixed Material Symbols Outlined font loading via `<link>` in `<head>`. Added dark theme with toggle in header (persisted in localStorage). All colors migrated to CSS custom properties. Dashboard updated: removed "New task" stat card, added "View" button on "Completed" card linking to `/orders?filter=completed`, added card entrance animations and hover scale effect. Thin borders on all cards, inputs and modals. User first name shown in header next to avatar. Chat and notification icons now have active fill state with badge. Removed BottomNav from app layout (component file kept for future use).
==============

### 2026-04-14 (4)
Глобальный фикс тёмной темы: все страницы приведены к единому дизайну. Заменены хардкодные цвета (`bg-white`, `#757682`, `#c5c5d3`, `#f2f4f6`, `#006c49`, `#191c1e` и др.) на CSS-переменные (`var(--surface)`, `var(--text-1..4)`, `var(--green)`, `var(--border)` и т.д.) во всех файлах: `tasks/create`, `tasks/[id]`, `orders`, `couriers`, `favorites`, `wallet`, `about`, `contacts`. Карточки получили `border: 1.5px solid var(--border)` и `var(--shadow-sm)`. Компонент `TaskCard` переведён на CSS-переменные. Кастомный дропдаун `SubjectSelect` добавлен на страницу контактов вместо нативного `<select>`.
---
Global dark theme fix: all pages brought to a unified design. Replaced hardcoded colours (`bg-white`, `#757682`, `#c5c5d3`, `#f2f4f6`, `#006c49`, `#191c1e`, etc.) with CSS variables (`var(--surface)`, `var(--text-1..4)`, `var(--green)`, `var(--border)`, etc.) across all pages: `tasks/create`, `tasks/[id]`, `orders`, `couriers`, `favorites`, `wallet`, `about`, `contacts`. Cards now have `border: 1.5px solid var(--border)` and `var(--shadow-sm)`. `TaskCard` component migrated to CSS variables. Custom `SubjectSelect` dropdown added to contacts page replacing native `<select>`.
==============

### 2026-04-14 (3)
Страница профиля: добавлены поля «Дата рождения» и переключатель «Есть личный автомобиль» (сохраняются в БД). Кнопка «Изменить фото» реализована — открывает file picker, загружает файл в Supabase Storage bucket `avatars`, обновляет `profiles.avatar_url`; при наведении аватарка показывает overlay с иконкой камеры. Фрейм «Опасная зона» удалён — осталась только красная кнопка выхода с hover-эффектом (фон становится полностью красным, текст белым). Метки полей стали светлее в тёмной теме (глобальный override `[data-theme="dark"] .label-sm`). Тип интерфейса Profile в types.ts дополнен полями `birth_date` и `has_car`. Схема БД `delivem_schema.sql` обновлена — добавлены колонки `birth_date DATE` и `has_car BOOLEAN`.
---
Profile page: added Date of birth field and Has car toggle (both saved to DB). Avatar upload now works — opens file picker, uploads to Supabase Storage `avatars` bucket, updates `profiles.avatar_url`; camera overlay appears on hover. Danger zone frame removed — only the red logout button remains with hover effect (background turns solid red, text turns white). Field labels are now lighter in dark mode via global `[data-theme="dark"] .label-sm` override. Profile interface in types.ts extended with `birth_date` and `has_car`. DB schema updated — added `birth_date DATE` and `has_car BOOLEAN` columns.
==============

### 2026-04-14 (2)
Страница профиля: заменены `bg-white` на `var(--surface)`, все хардкодные цвета переведены на CSS-переменные. Карточки получили контурную рамку `border: 1.5px solid var(--border)` и тень `var(--shadow-sm)`, как на остальных страницах. Имя профиля теперь читается корректно в обеих темах. Кнопка «Выйти из аккаунта» переоформлена: красная граница + фон с hover-эффектом. Выпадающий список городов заменён на кастомный компонент `CitySelect`. Добавлена умная маска телефона. Блок статистики курьера переведён на CSS-переменные.
---
Profile page: replaced `bg-white` with `var(--surface)`, all hardcoded colours migrated to CSS variables. Cards now have `border: 1.5px solid var(--border)` and `var(--shadow-sm)` shadow matching the rest of the app. Profile name is readable in both themes. "Sign out" button redesigned with red border, tinted background and hover effect. City dropdown replaced with custom `CitySelect`. Smart phone masking added. Courier stats block uses CSS variables.
==============

### 2026-04-14
Страница входа/регистрации: добавлена кнопка смены темы (ThemeToggle) в правом верхнем углу; все хардкодные цвета заменены на CSS-переменные, чтобы тёмная тема работала корректно. Поле телефона получило умную маску — пользователь вводит только цифры, формат `+7 (XXX) XXX-XX-XX` проставляется автоматически. Выпадающий список городов заменён на кастомный компонент со скруглёнными углами, анимацией и соответствием дизайн-системе. Текст «Нет аккаунта? Зарегистрироваться» и «Уже есть аккаунт? Войти» увеличен с `text-xs` до `text-sm`.
---
Auth page: added ThemeToggle button (top-right corner); replaced all hardcoded colours with CSS variables so dark mode works correctly. Phone field now has smart masking — user types digits only, `+7 (XXX) XXX-XX-XX` format is applied automatically. City dropdown replaced with a custom component featuring rounded corners, fade-in animation, and design-system colours. "No account? Register" and "Already have an account? Sign in" hint text increased from `text-xs` to `text-sm`.
==============

### 2026-04-13
Тёмная тема переработана с чёрной на тёмно-синюю палитру (--bg: #0c1425, --surface: #111e35). Светлая тема получила более выраженные синеватые оттенки. Улучшена видимость контуров карточек и полей ввода в обоих режимах (border: 1.5px solid var(--border) с голубоватым оттенком в тёмной теме). Удалён компонент BottomNav. Исправлена гидрация темы: добавлен suppressHydrationWarning на html и body, body больше не использует hardcoded inline-стили.
---
Dark theme reworked from near-black to deep navy palette (--bg: #0c1425, --surface: #111e35). Light theme updated with subtle blue tints. Improved card and input border visibility in both modes (1.5px solid var(--border) with blue tint in dark). Deleted BottomNav component. Fixed theme hydration: added suppressHydrationWarning to html and body, removed hardcoded inline styles from body.
==============
