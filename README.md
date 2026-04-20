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

### 2026-04-16 (5)
Правки мобильного UX (2-й итерации). 1) Dynamic Island / notch: вместо `padding-top` на топбаре добавлен `<div class="mobile-safe-spacer">` — отдельный элемент высотой `env(safe-area-inset-top)` с фоном как у топбара; на десктопе скрыт, на мобильном — блок. Это стандартный паттерн нативных iOS-приложений. 2) Топбар: высота зафиксирована в 60px, горизонтальные отступы уменьшены до 1rem на мобильном. 3) Дашборд заказчика: сетка стат-карточек изменена с `grid-cols-3` на `grid-cols-1 md:grid-cols-3` — на мобильном карточки складываются вертикально, текст не переносится; внешний отступ страницы на мобильном уменьшен до 1rem через класс `mobile-page-pad`. 4) globals.css: обновлён мобильный раздел — класс `.topbar-safe` упрощён (только высота), добавлен `.mobile-safe-spacer`, CSS для `.stat-card .label-sm` уменьшает шрифт метки на мобильном, чат пересчитан под новую формулу высоты без safe-area-top в вычитании.
---
Mobile UX fixes (2nd iteration). 1) Dynamic Island / notch: instead of `padding-top` on the topbar, added `<div class="mobile-safe-spacer">` — a standalone element with `height: env(safe-area-inset-top)` and the same glass background as the topbar; hidden on desktop, block on mobile. This is the standard native iOS app pattern. 2) Topbar: height fixed at 60px, horizontal padding reduced to 1rem on mobile. 3) Customer dashboard: stat cards grid changed from `grid-cols-3` to `grid-cols-1 md:grid-cols-3` — cards stack vertically on mobile so text no longer wraps; outer page padding reduced to 1rem on mobile via `mobile-page-pad` class. 4) globals.css: mobile section updated — `.topbar-safe` simplified (height only), `.mobile-safe-spacer` added, `.stat-card .label-sm` font reduced on mobile, chat height formula recalculated without safe-area-top.
==============

### 2026-04-16 (4)
Правки мобильной версии. 1) Корневой layout: добавлен `viewport: { viewportFit: 'cover' }` — без этого `env(safe-area-inset-*)` не работает на iPhone с вырезом/Dynamic Island. 2) BottomNav: высота увеличена с 64px до 76px, sheet «Ещё» поднимается выше. 3) Topbar: класс `h-[68px]` заменён на `.topbar-safe` — на мобильном высота авто, добавляется `padding-top: max(env(safe-area-inset-top), 10px)` чтобы контент не уходил под Dynamic Island/камеру. 4) Страница чата: внешний контейнер и фрейм переведены на CSS-классы `.chat-outer`/`.chat-frame`; на мобильном — нулевые отступы, скруглення и боковые бордеры убраны, высота вычисляется через `100dvh` с вычетом топбара, боткнав и safe-area — чат занимает ровно экран без внешнего скролла. 5) Страница архива: фильтры «Все / Выполнены / Отменены» на мобильном растягиваются на равную ширину и центрируются. 6) globals.css: добавлены классы `.chat-outer`, `.chat-frame`, `.orders-filters`, `.filter-btn`, `.topbar-safe` с десктопными и мобильными вариантами; карточки на мобильном получили `overflow: hidden` и `word-break: break-word`.
---
Mobile visual fixes. 1) Root layout: added `viewport: { viewportFit: 'cover' }` — required for `env(safe-area-inset-*)` to work on notched iPhones / Dynamic Island. 2) BottomNav: base height increased 64px → 76px, "More" sheet rises above. 3) Topbar: `h-[68px]` replaced with `.topbar-safe` CSS class — on mobile height is auto with `padding-top: max(env(safe-area-inset-top), 10px)` to keep content below notch/camera. 4) Chat page: outer container and frame migrated to `.chat-outer`/`.chat-frame` CSS classes; on mobile — zero padding, border-radius and side borders removed, height computed via `100dvh` minus topbar, bottom nav and safe areas — chat fits exactly in the viewport without outer scroll. 5) Archive page: filter tabs "All / Completed / Cancelled" stretch to equal width and are centered on mobile. 6) globals.css: added classes `.chat-outer`, `.chat-frame`, `.orders-filters`, `.filter-btn`, `.topbar-safe` with desktop and mobile variants; cards on mobile get `overflow: hidden` and `word-break: break-word`.
==============

### 2026-04-16 (3)
Мобильная адаптация интерфейса. Добавлен компонент `BottomNav` — нижняя навигационная панель, видимая только на экранах уже 768px. На мобильном: боковой сайдбар полностью скрывается (`display: none`), вместо него внизу фиксированный BottomNav с 4 основными пунктами + кнопка «Ещё» открывает bottom sheet с остальными разделами. Для заказчика центральная кнопка — «Создать поручение» (градиентная, приподнята). Topbar на мобильном: поиск заменяется логотипом Deliv'em, аватар и имя скрываются. Бейдж непрочитанных сообщений отображается на иконке чата в BottomNav. Добавлена анимация `slideUp` для bottom sheet. Основной контент получает `padding-bottom` равный высоте BottomNav с учётом `safe-area-inset-bottom` (поддержка iPhone с вырезом). На планшетах (768–899px) и десктопах поведение не изменилось. Изменены файлы: `BottomNav.tsx` (новый), `globals.css`, `layout.tsx`, `Topbar.tsx`.
---
Mobile layout adaptation. Added `BottomNav` component — a bottom navigation bar visible only on screens narrower than 768px. On mobile: the sidebar is fully hidden (`display: none`), replaced by a fixed BottomNav with 4 primary items + an "Ещё" (More) button that opens a bottom sheet with the remaining sections. For customers, the center button is "Create task" (gradient, raised). Topbar on mobile: search bar replaced with the Deliv'em logo, avatar and name are hidden. Unread message badge appears on the chat icon in BottomNav. Added `slideUp` animation for the bottom sheet. Main content gets `padding-bottom` equal to BottomNav height including `safe-area-inset-bottom` (iPhone notch support). Tablet (768–899px) and desktop behavior unchanged. Files changed: `BottomNav.tsx` (new), `globals.css`, `layout.tsx`, `Topbar.tsx`.
==============

### 2026-04-16 (2)
Карта создания поручения: нажатие Enter в полях «Откуда забрать» и «Куда доставить» теперь сразу запускает геокодинг и ставит метку на карте (ранее метка появлялась только при потере фокуса/клике мышью). Список подсказок при этом скрывается. Уведомления: добавлена автоочистка — при загрузке панели фильтруются и удаляются из БД записи старше 7 дней. В шапку панели уведомлений добавлена кнопка-корзина (delete) для мгновенной очистки всей истории — локально и в БД. Кнопка видна только если есть хотя бы одно уведомление, при наведении красная. Созданы серверные экшны `notifications-actions.ts`: `deleteOldNotifications` и `clearAllNotifications`.
---
Task creation map: pressing Enter in the "Pick up from" and "Deliver to" address fields now immediately triggers geocoding and places the marker on the map (previously the marker only appeared on blur/mouse-click). Suggestions dropdown is closed on Enter. Notifications: auto-cleanup added — entries older than 7 days are filtered out and deleted from DB when the panel loads. A trash icon button (delete) added to the notification panel header to instantly clear all history — both locally and in DB. Button is visible only when there is at least one notification, turns red on hover. Server actions `notifications-actions.ts` created: `deleteOldNotifications` and `clearAllNotifications`.
==============

### 2026-04-16
Страница контактов: поля «Ваше имя» и «Email» перенесены каждое на отдельную строку и растянуты на полную ширину фрейма. В блоке контактов убран номер телефона, почта изменена на `mincorey@internet.ru`, адрес обновлён на `Deliv'em | Республика Абхазия, г. Сухум | All Rights Reserved`. Подключена отправка сообщений из формы обратной связи в Telegram через Bot API: создан серверный экшн `contacts/actions.ts` (`sendToTelegram`), при успешной записи в Supabase вызывается Telegram API с HTML-форматированием (имя отправителя, email, тема, сообщение). Токен бота и chat_id берутся из переменных окружения `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
---
Contacts page: "Your name" and "Email" fields each moved to their own row and stretched to full frame width. In the contacts block, the phone number is removed, email updated to `mincorey@internet.ru`, address updated to `Deliv'em | Республика Абхазия, г. Сухум | All Rights Reserved`. Connected Telegram notification on contact form submit via Bot API: server action `contacts/actions.ts` (`sendToTelegram`) created; on successful Supabase insert, the Telegram API is called with HTML-formatted message (sender name, email, subject, message body). Bot token and chat ID are read from env vars `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
==============

### 2026-04-15 (6)
Страница профиля: кнопка «Выйти из аккаунта» теперь открывает модальное окно подтверждения вместо немедленного выхода. Модалка использует существующий компонент `Modal` (blur-оверлей, анимация), содержит иконку logout на красном фоне, заголовок «Выйти из аккаунта?», поясняющий текст и две кнопки: «Отмена» (ghost) и «Выйти» (красная, с hover scale). Клик вне окна или «Отмена» закрывают модалку без выхода.
---
Profile page: "Sign out" button now opens a confirmation modal instead of logging out immediately. The modal uses the existing `Modal` component (blur overlay, animation), features a red logout icon, "Sign out?" heading, explanatory text, and two buttons: "Cancel" (ghost) and "Sign out" (red, with hover scale). Clicking outside the modal or "Cancel" closes it without signing out.
==============

### 2026-04-15 (13)
Исправлена проблема «кнопка не работает»: все мутации статусов задания (`acceptTask`, `startTask`, `completeTask`, `confirmTask`, `rejectCompletion`, `cancelTask`) переведены на service-role (`adminClient`) для обхода RLS, которая блокировала UPDATE курьером чужой записи. Auth-проверка (`getUser`) по-прежнему выполняется через user-сессию. Кнопка «Принять задание» переименована в «Принять поручение».
---
Fixed "button does nothing" bug: all task status mutations (`acceptTask`, `startTask`, `completeTask`, `confirmTask`, `rejectCompletion`, `cancelTask`) now use service-role client (`adminClient`) to bypass RLS, which was silently blocking UPDATE by courier on another user's row. Auth check (`getUser`) still uses the user session. "Accept task" button renamed to "Принять поручение".
==============

### 2026-04-15 (12)
Реализована система взаимных оценок. Новый компонент `RatingBlock` — инлайн-блок прямо на странице поручения (вместо модального окна): аватар оцениваемого, интерактивные 5 звёзд, необязательный комментарий до 200 символов, кнопки «Пропустить» и «Отправить оценку». После отправки блок показывает поставленную оценку в режиме только для чтения. `submitRating` в `actions.ts` усилен: проверка что поручение завершено, пользователь — участник, оценивает именно противоположную роль (заказчик → курьер, курьер → заказчик), дубль невозможен. При загрузке страницы подгружается существующая оценка пользователя — если уже оценивал, блок сразу в режиме просмотра. SQL-триггер автоматически пересчитывает `courier_profiles.rating` как среднее арифметическое всех оценок после каждого INSERT в `ratings`.
---
Implemented mutual rating system. New `RatingBlock` component — inline block on the task detail page (replacing modal): rated person's avatar, interactive 5 stars, optional comment up to 200 chars, "Skip" and "Submit" buttons. After submission the block shows the given score in read-only mode. `submitRating` in `actions.ts` hardened: verifies task is completed, user is a participant, rates the opposite role only (customer→courier, courier→customer), duplicates blocked. On page load, existing rating is fetched — if already rated, block renders in view mode immediately. SQL trigger auto-recalculates `courier_profiles.rating` as average of all scores after each INSERT into `ratings`.
==============

### 2026-04-15 (11)
Настройки конфиденциальности: добавлен тип `PrivacySettings` и поле `privacy_settings JSONB` в интерфейс `Profile`. В настройках профиля появился раздел «Конфиденциальность» с тремя тумблерами: показывать телефон / «О себе» / возраст — сохраняются вместе с профилем. Публичная страница `/profile/[id]` переработана: красивый hero-блок с баннером и аватаром поверх него, бейдж роли, город, возраст/телефон/биография отображаются только если пользователь включил соответствующий тумблер, статистика курьера с разделителями, теги транспорта и доступности, дата регистрации внизу. Переход на собственный `/profile/[id]` редиректит на `/profile`. Страница курьеров: имя и аватар каждого курьера стали кликабельными ссылками на публичный профиль. Страница сообщений конвертирована в `'use client'`: аватар собеседника ведёт на `/profile/[id]`, основная часть карточки ведёт в чат.
---
Privacy settings: added `PrivacySettings` type and `privacy_settings JSONB` field to `Profile` interface. Profile settings page now has a "Privacy" section with three toggles: show phone / bio / age — saved together with profile. Public `/profile/[id]` page redesigned: hero block with gradient banner and overlapping avatar, role badge, city, age/phone/bio shown only if user enabled the corresponding toggle, courier stats with dividers, transport and availability tags, member-since date at bottom. Visiting own `/profile/[id]` redirects to `/profile`. Couriers page: each courier's name and avatar are now clickable links to their public profile. Messages page converted to `'use client'`: partner avatar links to `/profile/[id]`, main card area links to the chat.
==============

### 2026-04-15 (10)
Реализован новый флоу подтверждения поручений. Добавлен статус `awaiting_confirmation` (SQL: `ALTER TYPE task_status ADD VALUE`). Курьер нажимает «Выполнено» → статус меняется на `awaiting_confirmation`, заказчику уведомление. Заказчик видит инфо-баннер и две кнопки: «Подтвердить» → `completed` + уведомление курьеру и обновление статистики; «Отклонить» → возврат в `in_progress` + уведомление курьеру. Курьер видит баннер ожидания. Удалена логика автоматической выплаты вознаграждения — оплата происходит напрямую между заказчиком и курьером. Добавлена публичная страница профиля `/profile/[id]`: аватар, имя, роль, город, биография, статистика курьера, транспорт, статус доступности. В деталях поручения заказчик и курьер стали кликабельными ссылками с hover-эффектом. В `TaskCard` имена тоже кликабельны.
---
Implemented two-sided task confirmation flow. Added `awaiting_confirmation` status. Courier marks done → `awaiting_confirmation`, customer notified. Customer sees info banner + two buttons: "Confirm" → `completed`; "Reject" → back to `in_progress`. Removed automatic payout — payment is direct. Added public profile page `/profile/[id]` with avatar, stats, transport, availability. Customer/courier in task detail and TaskCard are now clickable profile links.
==============

### 2026-04-15 (9)
Исправлена ошибка сдвига времени дедлайна +3 часа: `DateTimePicker` теперь формирует строку через `new Date(year, month, day, h, m).toISOString()` вместо ручной строки без timezone — Supabase больше не трактует локальное время как UTC. Исправлен пустой фрейм на странице деталей поручения: блок «Участники» теперь не рендерится если `task.customer === null && task.courier === null`; разделитель между заказчиком и курьером показывается только если оба присутствуют.
---
Fixed deadline time shift of +3 hours: `DateTimePicker` now builds the string via `new Date(year, month, day, h, m).toISOString()` instead of a bare local string — Supabase no longer misinterprets local time as UTC. Fixed empty card on task detail page: the "Participants" block no longer renders when both `task.customer` and `task.courier` are null; the divider between customer and courier is shown only when both are present.
==============

### 2026-04-15 (8)
Фильтры на странице поиска поручений (`FeedFilters`): нативный `<select>` заменён на кастомный дропдаун в стиле сайта (скруглённые углы, цвета CSS-переменных, анимация `fadeInUp`, выделение активного пункта `var(--brand-soft)`). Поле минимальной оплаты расширено (`minWidth: 160px`), внутри иконка ₽ как prefix. Оба поля теперь занимают полную ширину своего контейнера. Исправлена ошибка на странице деталей поручения: `task.customer` может быть `null` при сбое JOIN-запроса — добавлена null-проверка перед рендером блока «Заказчик».
---
Task feed filters (`FeedFilters`): native `<select>` replaced with a custom dropdown matching the site design (rounded corners, CSS variable colors, `fadeInUp` animation, active item highlighted with `var(--brand-soft)`). Min reward field widened (`minWidth: 160px`) with a ₽ prefix icon. Both fields now fill their container width. Fixed crash on task detail page: `task.customer` can be `null` if the JOIN query fails — added a null-guard before rendering the "Customer" block.
==============

### 2026-04-15 (7)
Тосты (уведомления) перемещены в правый верхний угол (позиция `top: 80px, right: 20px`). Каждый тост теперь представляет собой карточку с иконкой (Material Symbols), текстом и кнопкой закрытия ×. Стиль по типу: success — зелёная рамка + `check_circle`, error — красная рамка + `error`, default — фирменная рамка + `info`. Анимация появления `slideInRight` добавлена в `globals.css`. Тосты автоматически исчезают через 3.5 секунды или закрываются вручную.
---
Toasts moved to the top-right corner (position `top: 80px, right: 20px`). Each toast is now a rounded card with an icon (Material Symbols), message text, and a × dismiss button. Styled by type: success — green border + `check_circle`, error — red border + `error`, default — brand border + `info`. `slideInRight` keyframe animation added to `globals.css`. Toasts auto-dismiss after 3.5s or can be closed manually.
==============

### 2026-04-15 (6)
Страница профиля (раздел курьера): убран отдельный переключатель «Есть личный автомобиль» (`has_car`) для всех пользователей. Для курьеров добавлен единый переключатель «Есть транспорт» — если включён, появляется выбор из 4 вариантов (Автомобиль, Мопед, Велосипед, Самокат); если выключен — тип транспорта сбрасывается на `foot`. Логика сохранения очищена: `has_car` больше не сохраняется в `profiles`. В `types.ts` обновлены метки: `truck` → «Самокат» (electric_scooter), `motorcycle` → «Мопед» (two_wheeler); добавлен массив `VEHICLE_TRANSPORT_TYPES` = `['car', 'motorcycle', 'bicycle', 'truck']`.
---
Profile page (courier section): removed the separate "Has personal car" (`has_car`) toggle for all users. For couriers a single "Has transport" toggle was added — when ON, shows 4 vehicle options (Car, Moped, Bicycle, Scooter); when OFF, transport type resets to `foot`. Save logic cleaned up: `has_car` no longer written to `profiles`. In `types.ts` updated labels: `truck` → «Самокат» (electric_scooter), `motorcycle` → «Мопед» (two_wheeler); added `VEHICLE_TRANSPORT_TYPES` array = `['car', 'motorcycle', 'bicycle', 'truck']`.
==============

### 2026-04-15 (5)
Единый стиль карточек на всём сайте. `TaskCard`: иконка типа теперь в квадратном контейнере 40×40px с скруглёнными углами; заголовок увеличен до 0.95rem (было text-sm/14px); адресная строка — 0.78rem; имя курьера/заказчика выделено font-weight 600; вознаграждение — 1rem font-black; отступы карточки увеличены (`1rem` → `1.1rem 1.25rem`). Иконка типа задания 22px вместо 20px. CSS `.task-card` — скруглён чуть больше (1.15rem), hover теперь подсвечивает `var(--brand)` рамку + синий glow в тёмной теме. `.courier-card` — те же отступы и hover-эффект с `translateY(-1px)`. Все карточки поручений и курьеров теперь единого размера и стиля на дашборде, ленте заданий, архиве, избранном.
---
Unified card style across the whole site. `TaskCard`: task-type icon now sits in a 40×40px rounded square container; title enlarged to 0.95rem (was text-sm/14px); address line 0.78rem; courier/customer name highlighted with font-weight 600; reward 1rem font-black; card padding increased (`1rem` → `1.1rem 1.25rem`); type icon 22px instead of 20px. CSS `.task-card` — slightly rounder (1.15rem), hover now highlights with `var(--brand)` border + blue glow in dark theme. `.courier-card` — same padding and hover effect with `translateY(-1px)`. All task and courier cards are now a consistent size and style across dashboard, task feed, archive, and favorites.
==============

### 2026-04-15 (4)
Исправлены три проблемы: 1) Отступы в блоке адресов «Откуда/Куда» на странице деталей поручения увеличены (`p-4` → `padding: 1rem 1.25rem`), адреса больше не прижаты к краям. 2) Уведомления: при открытии панели все непрочитанные помечаются как прочитанные (оптимистично в state + запись в БД), badge исчезает сразу; панель закрывается кликом по любой области вне неё; добавлена кнопка × в шапке панели; иконки уведомлений по типу (кошелёк, задание, чат, рейтинг). 3) Исправлена история операций кошелька: в таблице `transactions` не было RLS-политики для INSERT, поэтому записи не сохранялись. Создан серверный экшн `wallet/actions.ts` (`topUpWallet`) использующий service-role клиент для обхода RLS — теперь транзакции сохраняются корректно. После пополнения автоматически создаётся уведомление типа `wallet` в таблице `notifications`. История показывает последние 10 операций и обновляется сразу после пополнения.
---
Fixed three issues: 1) Address block padding in task detail page increased (`p-4` → `padding: 1rem 1.25rem`) — addresses no longer hug the card edges. 2) Notifications: opening the panel marks all unread as read (optimistic local state update + DB write); badge disappears immediately; panel closes on any outside click; added × close button in panel header; notification icons by type (wallet, task, chat, rating). 3) Fixed wallet transaction history: the `transactions` table had no INSERT RLS policy, so records were never actually saved. Created server action `wallet/actions.ts` (`topUpWallet`) using service-role client to bypass RLS — transactions now persist correctly. After top-up, a `wallet` type notification is automatically inserted into `notifications`. History shows last 10 operations and refreshes immediately after top-up.
==============

### 2026-04-15 (3)
Подключена Яндекс Карта (API 2.1) на страницу создания поручения. Создан компонент `AddressMapPicker` (`src/components/ui/AddressMapPicker.tsx`): единая карта на 380px, центрированная на Республику Абхазия (Сухум, zoom 10), два поля ввода адресов «Откуда» и «Куда» с автодополнением через `ymaps.suggest()` (ограничено bbox Абхазии), геокодирование адреса → маркер на карте, обратное геокодирование при клике на карту → адрес в активное поле, пунктирная линия маршрута между маркерами A и B, карта автоматически масштабируется чтобы показать оба маркера. Активное поле подсвечивается цветом (красный = «Откуда», зелёный = «Куда»), floating badge на карте показывает какой маркер будет выставлен при клике. API-ключ: `NEXT_PUBLIC_YANDEX_MAPS_KEY` в `.env.local`. Страница `tasks/create` обновлена — заменены два отдельных блока-заглушки карты на единый `<AddressMapPicker>`.
---
Integrated Yandex Maps (API 2.1) on the task creation page. New component `AddressMapPicker` (`src/components/ui/AddressMapPicker.tsx`): single 380px map centered on the Republic of Abkhazia (Sukhum, zoom 10), two address inputs ("From" / "To") with autocomplete via `ymaps.suggest()` (bounded to Abkhazia bbox), address → marker geocoding, click on map → reverse geocode → fills active input, dashed route polyline between markers A and B, map auto-fits to show both markers. Active input highlighted (red = From, green = To), floating glass badge on map shows which marker a click will place. API key: `NEXT_PUBLIC_YANDEX_MAPS_KEY` in `.env.local`. `tasks/create` page updated — two placeholder map blocks replaced with single `<AddressMapPicker>`.
==============

### 2026-04-15 (2)
Фон с картой (`.map-bg::before`) получил градиентное затухание снизу через `mask-image: linear-gradient(to bottom, black 30%, transparent 80%)` — изображение теперь плавно растворяется при прокрутке вместо резкого обрыва. Также исправлено `background-position: center top`, чтобы карта всегда начиналась с верхней части.
---
Map background (`.map-bg::before`) now fades out smoothly at the bottom via `mask-image: linear-gradient(to bottom, black 30%, transparent 80%)` — the image dissolves gracefully when scrolling instead of cutting off abruptly. Also fixed `background-position: center top` so the map always anchors to the top of the container.
==============

### 2026-04-15
Убраны эмодзи-смайлы 👋 из заголовков дашборда (как для заказчика, так и для курьера). Исправлены цвета текста в тёмной теме: `--text-3` изменён с `#506d98` на `#7bafd4`, `--text-4` — с `#2b4268` на `#4d7aaa` — оба теперь хорошо читаемы на тёмном фоне. Добавлены CSS-анимации: `page-header` (fade-in сверху для заголовков страниц), `icon-float` (плавающая иконка для пустых состояний), `pulse-dot` (пульсация зелёной точки онлайн-статуса). Карточки `.stat-card` получили `transform: translateY(-2px)` при наведении и слабый синий glow в тёмной теме. Все пустые состояния (dashboard, tasks, orders, couriers, favorites, messages) обновлены: иконки анимированы, тексты «нет данных» стали светлее и читаемее. Исправлены захардкоженные светлые цвета (`#757682`, `#c5c5d3`, `#f0f4ff`, `#eceef0`) на CSS-переменные (`var(--text-2..3)`, `var(--surface)`, `var(--border)`) в файлах `tasks/page.tsx` и `messages/page.tsx`. Карточки диалогов на странице сообщений теперь корректно адаптируются к тёмной теме.
---
Removed 👋 emoji from dashboard greeting headings (both customer and courier). Fixed dark-theme text contrast: `--text-3` changed from `#506d98` to `#7bafd4`, `--text-4` changed from `#2b4268` to `#4d7aaa` — both now readable on dark backgrounds. Added CSS animations: `page-header` (fade-in-down for page titles), `icon-float` (gentle float loop for empty-state icons), `pulse-dot` (green glow pulse for online status dots). `.stat-card` now lifts `translateY(-2px)` on hover and gets a subtle blue glow in dark mode. All empty states (dashboard, tasks, orders, couriers, favorites, messages) updated with floating icons and lighter, more visible text colors. Replaced hardcoded light-mode colors (`#757682`, `#c5c5d3`, `#f0f4ff`, `#eceef0`) with CSS variables (`var(--text-2..3)`, `var(--surface)`, `var(--border)`) in `tasks/page.tsx` and `messages/page.tsx`. Message list items now correctly adapt to dark theme.
==============

### 2026-04-14 (6)
Верхняя панель (Topbar): высота увеличена с `h-14` (56px) до `h-[68px]`, горизонтальные отступы расширены (`px-5` → `px-6`), строка поиска стала выше (36px → 42px) и шире (`max-w-xs` → `max-w-sm`), иконки увеличены (20px → 23px), кнопки-иконки увеличены (32px → 38px), аватарка в хедере увеличена (30px → 34px), шрифт имени и строки поиска — 0.925rem. Страница профиля: кнопка «Выйти из аккаунта» обёрнута в `flex`-контейнер и выровнена по центру страницы. Фон главной области: картинка `map.jpg` (из `src/img/`) скопирована в `public/img/map.jpg` и применена как фон через CSS-псевдоэлемент `::before` с opacity 0.04 (светлая тема) / 0.06 с `invert+hue-rotate` (тёмная тема) на элемент `<main>` через класс `.map-bg`.
---
Topbar: height increased from `h-14` (56px) to `h-[68px]`, padding widened (`px-5` → `px-6`), search bar taller (36px → 42px) and wider (`max-w-xs` → `max-w-sm`), icons enlarged (20px → 23px), icon buttons enlarged (32px → 38px), header avatar enlarged (30px → 34px), name and search font set to 0.925rem. Profile page: "Sign out" button wrapped in a `flex` container and centered. Main area background: `map.jpg` (from `src/img/`) copied to `public/img/map.jpg` and applied as a CSS `::before` pseudo-element background with opacity 0.04 (light theme) / 0.06 with `invert+hue-rotate` (dark theme) on the `<main>` element via class `.map-bg`.
==============

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

### 2026-04-15
Курьер: добавлен пункт «Активные» в боковое меню (иконка rocket_launch) и соответствующая страница `/active`, отображающая поручения со статусами `matched`, `in_progress`, `awaiting_confirmation`. Чат: исправлена отправка сообщений — INSERT в таблицу `messages` теперь выполняется через серверное действие `sendChatMessage` с сервисным ключом, обходящим RLS (ранее вставка молча блокировалась политиками RLS). При отправке сообщения получатель получает уведомление типа `new_message`. Интерфейс чата переработан: мессенджер-стиль в красивом фрейме с закруглёнными углами, пузыри группируются по автору, аватар партнёра отображается у первого сообщения в группе, индикатор отправки, отображение ошибок прямо в интерфейсе.
---
Courier: added "Активные" (Active) sidebar item (rocket_launch icon) and `/active` page showing tasks with statuses `matched`, `in_progress`, `awaiting_confirmation`. Chat: fixed message sending — INSERT into `messages` table now goes through `sendChatMessage` server action with service-role key bypassing RLS (previously the insert was silently blocked by RLS policies). On send, the recipient receives a `new_message` notification. Chat UI reworked to messenger-style framed layout with rounded corners, author-grouped bubbles, partner avatar on first message in group, send indicator, and inline error display.
==============

### 2026-04-15 (2)
Уведомления: заменён fixed-backdrop на document.addEventListener('mousedown') через useRef — теперь панель закрывается по клику в любом месте экрана. Кнопка колокольчика стала toggleable. Добавлены иконка и цвет для типа уведомления `new_message`. Чат: добавлен оптимистичный вывод сообщения сразу при отправке (до ответа сервера); при ошибке сообщение удаляется и текст восстанавливается. Realtime-обработчик теперь заменяет оптимистичное сообщение реальным при совпадении sender_id и content. Дашборд заказчика: статус `awaiting_confirmation` добавлен в запрос активных поручений; над статистикой появляется жёлтый баннер «Требует вашего подтверждения» со ссылкой на страницу детали задания — заказчик больше не может пропустить запрос на подтверждение.
---
Notifications: replaced fixed-backdrop with document.addEventListener('mousedown') via useRef — panel now closes on click anywhere on screen. Bell button is now a toggle. Added icon and colour for `new_message` notification type. Chat: optimistic message display added on send (shown immediately before server response); removed on error with input text restored. Realtime handler now replaces the optimistic message with the real one when sender_id and content match. Customer dashboard: `awaiting_confirmation` status added to active tasks query; a yellow "Requires your confirmation" banner appears above stats cards linking directly to the task detail page — customers can no longer miss a completion request.
==============

### 2026-04-15 (3)
Курьеры: исправлен счётчик выполненных заданий — вызов несуществующего RPC `increment_courier_tasks` заменён прямым UPDATE таблицы `courier_profiles` (поля `completed_tasks` и `total_tasks` инкрементируются при подтверждении заказчиком). Страница «О сервисе»: год запуска исправлен на 2026, метка «Регион» переименована в «Страна», значение изменено на «Республика Абхазия, г. Сухум». Боковое меню заказчика: «Архив заказов» переименован в «Архив».
---
Couriers: fixed completed task counter — replaced non-existent `increment_courier_tasks` RPC call with a direct UPDATE on `courier_profiles` (fields `completed_tasks` and `total_tasks` are incremented when customer confirms completion). About page: launch year corrected to 2026, label "Регион" renamed to "Страна", value updated to "Республика Абхазия, г. Сухум". Customer sidebar: "Архив заказов" renamed to "Архив".
==============

### 2026-04-16 (3)
Авторизация на мобильных устройствах: исправлена проблема, при которой вход/регистрация через браузерный Supabase клиент не устанавливал сессию на сервере при доступе по локальному IP-адресу (HTTP). Браузерный клиент писал токен в localStorage и `document.cookie`, но Next.js middleware не подхватывал cookies при первом редиректе → пользователь оказывался обратно на странице `/auth`. Решение: логин и регистрация перенесены в Server Actions (`src/app/(auth)/auth/actions.ts`), которые вызывают `supabase.auth.signInWithPassword` / `signUp` через серверный клиент — тот пишет cookies напрямую в заголовки HTTP-ответа через `next/headers`. После успеха вызывается `router.refresh()` + `router.push('/dashboard')`.
---
Mobile auth fix: fixed an issue where login/registration via the browser-side Supabase client did not establish a server-readable session when accessing via local IP over HTTP. The browser client wrote the token to localStorage and `document.cookie`, but the Next.js middleware didn't pick up the cookies on the first redirect — the user was sent back to `/auth`. Fix: login and registration moved to Server Actions (`src/app/(auth)/auth/actions.ts`), which call `signInWithPassword`/`signUp` via the server client — it writes cookies directly into HTTP response headers via `next/headers`. On success, the client calls `router.refresh()` + `router.push('/dashboard')`.
==============

### 2026-04-16 (2)
Нижнее меню: кнопка «Чат» заменена на «Профиль» (чат дублировался в верхнем меню — теперь убрали дублирование). Статусы поручений: исправлено согласование по роду — «Свободен» → «Свободно», «Принят» → «Принято» (поручение — средний род). Профиль: кнопка «Выйти из аккаунта» расширена до полной ширины на мобильной версии и имеет фиксированную минимальную ширину 220px на десктопе.
---
Bottom nav: "Chat" button replaced with "Profile" (chat was duplicated in the top bar — removed redundancy). Task status labels: fixed grammatical gender agreement — "Свободен" → "Свободно", "Принят" → "Принято" (поручение is neuter gender in Russian). Profile: "Sign out" button is now full width on mobile and has a fixed min-width of 220px on desktop.
==============

### 2026-04-16
Редактирование поручений: заказчик теперь может изменить опубликованное поручение (статус `published`). Добавлена страница `/tasks/[id]/edit` — предзаполненная форма со всеми полями (тип, название, вознаграждение, адреса с картой, срок, описание), без повторного списания 100 ₽. Добавлен server action `updateTask` в `actions.ts` с проверкой владельца и статуса. На странице деталей поручения (`/tasks/[id]`) в шапке появилась кнопка «Изменить» (видна только заказчику на статусе `published`). На карточке поручения (`TaskCard`) появилась ссылка «Изменить» для владельца — через опциональный проп `currentUserId`; иконка передаётся на дашборде и странице активных поручений.
---
Task editing: customers can now edit their published tasks (status `published`). Added `/tasks/[id]/edit` page — a pre-filled form with all fields (type, title, reward, address map picker, deadline, description), with no additional 100 ₽ charge. Added `updateTask` server action in `actions.ts` with owner and status validation. An "Edit" button appears in the task detail page header (`/tasks/[id]`) — visible only to the task owner on `published` status. An "Edit" link appears on `TaskCard` for the task owner via optional `currentUserId` prop; prop passed from the dashboard and active tasks page.
==============

### 2026-04-17
Аутентификация и навигация: исправлена невозможность войти в аккаунт. Файл `src/middleware.ts` переименован в `src/proxy.ts` с экспортом функции `proxy` согласно требованиям Next.js 16. В `next.config.ts` добавлен `allowedDevOrigins` для устранения ошибок cross-origin при доступе по локальной сети. В `auth/page.tsx` заменён вызов `router.refresh() + router.push()` на `window.location.href` — устранены ошибки «Router action dispatched before initialization». Счётчик непрочитанных сообщений теперь реактивный: создан клиентский компонент `AppShell`, который подписывается на Supabase Realtime (INSERT/UPDATE в таблице `messages`) и обновляет счётчик во всех трёх компонентах (Topbar, Sidebar, BottomNav) без перезагрузки страницы.
---
Auth and navigation fixes: resolved inability to log in. Renamed `src/middleware.ts` to `src/proxy.ts` with `proxy` function export as required by Next.js 16. Added `allowedDevOrigins` to `next.config.ts` to eliminate cross-origin errors on LAN access. Replaced `router.refresh() + router.push()` with `window.location.href` in `auth/page.tsx` — fixes «Router action dispatched before initialization» errors. Unread messages badge is now reactive: created `AppShell` client component that subscribes to Supabase Realtime (INSERT/UPDATE on `messages` table) and updates the counter across all three layout components (Topbar, Sidebar, BottomNav) without page reload.
==============

### 2026-04-17 (2)
Этап 1 — Атомарная защита от гонки при принятии поручения: `acceptTask` теперь использует единый атомарный UPDATE с условием `.eq('status', 'published')`, исключающий одновременное принятие двумя курьерами. При неудаче возвращается понятное сообщение «Поручение уже взял другой курьер».
Этап 2 — Счётчик непрочитанных сообщений: `AppShell` теперь обновляет счётчик при каждой смене страницы (`usePathname`) — счётчик сбрасывается сразу после выхода из чата. Realtime-подписка оставлена только для входящих сообщений (INSERT).
Этап 3 — Hover-анимации кнопок: улучшены `.btn-primary` (translateY + shadow), `.btn-green` (translateY + shadow), `.btn-ghost` (translateY + border), `.type-btn` (scale + shadow); добавлен класс `.btn-icon` для иконочных кнопок Topbar/ThemeToggle; везде добавлены `active`-состояния с scale(0.97) для тактильного отклика.
---
Step 1 — Atomic race condition fix for task acceptance: `acceptTask` now uses a single atomic UPDATE with `.eq('status', 'published')` guard, preventing two couriers from accepting simultaneously. Returns a clear "already taken" message on failure.
Step 2 — Unread messages counter fix: `AppShell` now refreshes the count on every page navigation (`usePathname`) — badge clears immediately after leaving the chat. Realtime subscription kept only for incoming messages (INSERT).
Step 3 — Button hover animations: improved `.btn-primary` (translateY + shadow), `.btn-green` (translateY + shadow), `.btn-ghost` (translateY + border), `.type-btn` (scale + shadow); added `.btn-icon` class for Topbar/ThemeToggle icon buttons; added `active` press states with scale(0.97) for tactile feedback across all button types.
==============

[2026-04-17 — Realtime обновления статуса поручений]
Добавлены Supabase Realtime подписки для мгновенных обновлений без перезагрузки страницы:
- `tasks/[id]/page.tsx`: подписка на UPDATE событие таблицы `tasks` по конкретному `id`. Когда курьер нажимает "Отметить как выполненное", страница заказчика автоматически обновляется и показывает кнопки подтверждения/отклонения.
- `AppShell.tsx`: подписка на INSERT событие таблицы `notifications` для текущего пользователя. При появлении нового уведомления (например, "Курьер завершил поручение") показывается всплывающий тост в реальном времени на любой странице приложения.
**Требование:** в панели Supabase необходимо включить Realtime для таблиц `tasks` и `notifications` (Database → Replication → Supabase Realtime → добавить таблицы).
---
[2026-04-17 — Realtime task status updates without page refresh]
Added Supabase Realtime subscriptions for instant updates:
- `tasks/[id]/page.tsx`: subscribes to UPDATE events on the `tasks` table filtered by task id. When a courier marks a task as done, the customer's page automatically refreshes and shows confirm/reject buttons.
- `AppShell.tsx`: subscribes to INSERT events on the `notifications` table for the current user. When a new notification arrives (e.g. "Courier completed the task"), a toast appears in real-time on any page.
**Requirement:** enable Realtime for `tasks` and `notifications` tables in Supabase dashboard (Database → Replication → Supabase Realtime).
==============

[2026-04-17 — Поручения в статусе awaiting_confirmation добавлены в Активные]
На странице "Активные поручения" (`tasks/page.tsx`) в фильтр статусов добавлен `awaiting_confirmation`. Теперь поручения, отмеченные курьером как выполненные и ожидающие подтверждения заказчика, отображаются в Активных, а не пропадают до обновления страницы.
---
[2026-04-17 — awaiting_confirmation tasks now appear in Active tasks list]
Added `awaiting_confirmation` to the status filter in `CustomerActiveTasks` (`tasks/page.tsx`). Tasks marked as done by the courier and awaiting customer confirmation now appear in the Active list instead of disappearing until page refresh.
==============

[2026-04-17 — Фикс счётчика заданий, пересчёт рейтинга, секция отзывов]
1. `actions.ts` → `confirmTask`: счётчики `completed_tasks` и `total_tasks` теперь берутся прямым COUNT из таблицы `tasks` (не хрупким инкрементом), запись в `courier_profiles` через upsert — фикс бага с нулём у активных курьеров.
2. `actions.ts` → `submitRating`: после каждой оценки пересчитывается среднее по всем оценкам из таблицы `ratings` и сохраняется в `courier_profiles.rating` через upsert. Раньше рейтинг никогда не обновлялся.
3. `profile/[id]/page.tsx`: добавлена секция "Отзывы" — карточки с аватаром автора, датой, звёздами и текстом комментария. Загружается параллельно с остальными данными профиля.
---
[2026-04-17 — Task counter fix, rating recalc, reviews section on profile]
1. `confirmTask`: counters now computed via direct COUNT from `tasks` table + upsert, fixing zero-counter bug for active couriers.
2. `submitRating`: recalculates average rating from all `ratings` rows after each submission and persists to `courier_profiles.rating` — was never updated before.
3. `profile/[id]/page.tsx`: added Reviews section showing cards with author avatar, date, star row, and comment text.
==============

[2026-04-17 — Увеличена ширина сайдбара]
`globals.css`: ширина `.sidebar-auto` и `.sidebar-expanded` увеличена с 240px до 260px — длинная надпись "Избранные заказчики" больше не выезжает за пределы кнопки.
---
[2026-04-17 — Sidebar width increased]
`globals.css`: `.sidebar-auto` and `.sidebar-expanded` widths increased from 240px to 260px so the "Избранные заказчики" label fits without overflow.
==============

[2026-04-17 — Рейтинг в шапке профиля, расчёт из отзывов]
`profile/[id]/page.tsx`: рейтинг теперь вычисляется прямо из загруженных отзывов (среднее арифметическое) — поле `courier_profiles.rating` в БД больше не используется для отображения, т.к. могло содержать устаревшее значение. Рейтинг ★ и количество отзывов добавлены в шапку героя справа от имени. Блок статистики тоже обновлён на вычисленное значение.
---
[2026-04-17 — Rating in profile hero, computed from reviews]
`profile/[id]/page.tsx`: rating is now computed directly from loaded reviews (arithmetic mean) instead of trusting the `courier_profiles.rating` DB field which could be stale. Star rating and review count added to the hero header next to the name. Stats block also updated to use the computed value.
==============

[2026-04-17 — Фикс данных в списке курьеров, переключатель доступности, актуальная статистика]
1. `couriers/page.tsx`: рейтинг и счётчик выполненных заданий теперь вычисляются из таблиц `ratings` и `tasks` (не из устаревших полей `courier_profiles`). Сортировка по живому рейтингу. Если оценок нет — показывается "Нет оценок" вместо дефолтного 5.0.
2. `profile/page.tsx`: добавлен переключатель "Доступность" для курьеров — сохраняется в `courier_profiles.is_available`. Это поле определяет статус Онлайн/Оффлайн в списке курьеров. Статистика на странице настроек теперь читается из источника правды (реальный COUNT заданий, среднее из оценок).
---
[2026-04-17 — Live data on couriers list, availability toggle, accurate stats]
1. `couriers/page.tsx`: rating and completed count now computed from `ratings` and `tasks` tables instead of stale `courier_profiles` fields. Sorted by live rating. Shows "No ratings" instead of default 5.0.
2. `profile/page.tsx`: added Availability toggle for couriers — saves to `courier_profiles.is_available`, controls Online/Offline status on couriers list. Settings stats now read from source of truth (real task COUNT, average from ratings).
==============

[2026-04-17 — Удалена функция доступности/онлайн-оффлайн курьера]
Убрали индикатор "Онлайн/Оффлайн" и "Доступен/Недоступен" со всех страниц: список курьеров (`couriers/page.tsx`), публичный профиль (`profile/[id]/page.tsx`), настройки профиля (`profile/page.tsx`). Все связанные state-переменные и логика сохранения удалены.
---
[2026-04-17 — Removed courier availability/online-offline feature]
Removed online/offline and available/unavailable indicators from all pages: couriers list, public profile, profile settings. All related state variables and save logic removed.
==============

[2026-04-17 — Дашборд курьера: живые данные, убран статус онлайн/оффлайн]
`dashboard/page.tsx` → `CourierDashboard`: рейтинг теперь вычисляется из таблицы `ratings` (среднее арифметическое), счётчик выполненных заданий — прямым COUNT из `tasks`. Карточка "Статус" (Онлайн/Оффлайн) убрана. Сетка стала 3-колоночной вместо 4.
---
[2026-04-17 — Courier dashboard: live data, removed online/offline status card]
`CourierDashboard`: rating now computed from `ratings` table, completed count from direct COUNT on `tasks`. "Status" card (Online/Offline) removed. Grid changed from 4 to 3 columns.
==============

[2026-04-17 — Enforcement настроек конфиденциальности через RPC]
`delivem_schema.sql`: добавлена функция `get_public_profile(target_id UUID)` — возвращает JSON профиля с маскировкой на уровне БД: `phone` возвращается только при `show_phone=true`, `bio` — при `show_bio != false` (дефолт true), `birth_date` — при `show_birth_date=true`. `email` и `wallet_balance` никогда не возвращаются. `profile/[id]/page.tsx`: заменён `select('*')` на `rpc('get_public_profile')` — чувствительные данные больше не отправляются клиенту когда скрыты. Ранее privacy settings были только UI-уровнем; теперь enforcement на уровне БД. Создан файл миграции `supabase/migrations/add_get_public_profile_rpc.sql`.
---
[2026-04-17 — Privacy settings enforcement via RPC]
`delivem_schema.sql`: added `get_public_profile(target_id UUID)` function — returns masked profile JSON: `phone` only when `show_phone=true`, `bio` when `show_bio != false` (default true), `birth_date` when `show_birth_date=true`. `email` and `wallet_balance` never exposed. `profile/[id]/page.tsx`: replaced `select('*')` with `rpc('get_public_profile')` — sensitive data no longer sent to client when hidden. Previously privacy settings were UI-only; now enforced at DB level. Migration file `supabase/migrations/add_get_public_profile_rpc.sql` created.
==============

[2026-04-17 — Удалён дублирующий пересчёт рейтинга в submitRating]
`tasks/actions.ts` → `submitRating`: удалён ручной пересчёт среднего рейтинга (SELECT всех оценок + UPDATE courier_profiles), который выполнялся после INSERT. Пересчёт уже выполняется атомарно DB-триггером `recalc_courier_rating` (AFTER INSERT ON ratings) внутри той же транзакции. Двойной пересчёт создавал race condition: триггер и app-код одновременно писали в одну строку courier_profiles, app-код мог использовать устаревшие данные.
---
[2026-04-17 — Removed duplicate rating recalculation in submitRating]
`tasks/actions.ts` → `submitRating`: removed manual average rating recalculation (SELECT all scores + UPDATE courier_profiles) that ran after INSERT. Recalculation is already handled atomically by the `recalc_courier_rating` DB trigger (AFTER INSERT ON ratings) within the same transaction. The duplicate caused a race condition: trigger and app code wrote to the same courier_profiles row simultaneously, with app code potentially using stale data.
==============

[2026-04-17 — Фикс realtime-хендлера в чате: обработка ошибок и stale closure]
`messages/[taskId]/page.tsx`: исправлены три проблемы realtime-подписки. 1) Добавлены `currentUserRef` и `partnerRef` — `useRef`-зеркала state, доступные внутри realtime-замыкания без stale значений. 2) Хендлер теперь использует кэшированные профили вместо запроса к БД (0 запросов для 2 известных участников). 3) Добавлена обработка ошибок: если профиль отправителя не загружается — сообщение пропускается (return) вместо краша с `undefined sender`.
---
[2026-04-17 — Chat realtime handler: error handling and stale closure fix]
`messages/[taskId]/page.tsx`: fixed three realtime subscription issues. 1) Added `currentUserRef` and `partnerRef` — `useRef` mirrors of state, accessible inside the realtime closure without stale values. 2) Handler now uses cached profiles instead of DB query (0 extra requests for the 2 known participants). 3) Added error handling: if sender profile cannot be loaded, the message is skipped (return) instead of crashing with `undefined sender`.
==============

[2026-04-17 — Фикс счётчика непрочитанных сообщений]
`AppShell.tsx`: `refreshCount` переписан с двух запросов (все task IDs + count) на один вызов RPC `get_unread_message_count` — JOIN прямо в БД, O(1) по числу заданий. Realtime-подписка теперь слушает и INSERT и UPDATE на таблице `messages` — счётчик корректно сбрасывается когда чат помечает сообщения прочитанными. `delivem_schema.sql`: добавлена функция `get_unread_message_count(p_user_id UUID)` с `SECURITY DEFINER STABLE`. Создан файл миграции `supabase/migrations/add_get_unread_message_count_rpc.sql`.
---
[2026-04-17 — Unread messages counter fix]
`AppShell.tsx`: `refreshCount` rewritten from two queries (fetch all task IDs + count) to a single RPC call `get_unread_message_count` — JOIN runs in DB, O(1) regardless of task count. Realtime subscription now listens to both INSERT and UPDATE on `messages` — counter correctly resets when chat marks messages as read. `delivem_schema.sql`: added `get_unread_message_count(p_user_id UUID)` function with `SECURITY DEFINER STABLE`. Migration file `supabase/migrations/add_get_unread_message_count_rpc.sql` created.
==============

[2026-04-17 — Добавлены недостающие индексы в БД]
`delivem_schema.sql`: добавлены три индекса. `idx_courier_profiles_rating` — сортировка курьеров по рейтингу. `idx_profiles_role` — запросы по роли пользователя (страница курьеров). `idx_messages_unread` — частичный (partial) индекс только по непрочитанным сообщениям (`WHERE is_read = false`): простой индекс по булеву полю неэффективен, частичный в разы меньше по размеру и быстрее. Замечание: `profiles.email` и `profiles.phone` уже проиндексированы неявно через `UNIQUE` constraint. Создан файл миграции `supabase/migrations/add_missing_indexes.sql`.
---
[2026-04-17 — Added missing DB indexes]
`delivem_schema.sql`: added three indexes. `idx_courier_profiles_rating` — courier sorting by rating. `idx_profiles_role` — role-based queries (couriers list). `idx_messages_unread` — partial index on unread messages only (`WHERE is_read = false`): a plain boolean index is not selective; a partial index is far smaller and faster. Note: `profiles.email` and `profiles.phone` are already implicitly indexed via their `UNIQUE` constraints. Migration file `supabase/migrations/add_missing_indexes.sql` created.
==============

[2026-04-17 — Infinite scroll на страницах заданий и курьеров]
Заменена URL-пагинация на infinite scroll через IntersectionObserver. Созданы клиентские компоненты `CourierFeed.tsx` и `CouriersList.tsx`; `tasks/page.tsx` и `couriers/page.tsx` остались server components (auth/redirect). Данные подгружаются порциями (20 заданий / 15 курьеров) при скролле к низу страницы. Смена фильтров → `key` меняется → компонент ремаунтится и сбрасывает список. Рейтинги и статистика курьеров подгружаются инкрементально для каждой партии. В `globals.css` добавлена анимация `@keyframes spin` для спиннера загрузки.
---
[2026-04-17 — Infinite scroll on tasks and couriers pages]
Replaced URL-based pagination with infinite scroll via IntersectionObserver. Created client components `CourierFeed.tsx` and `CouriersList.tsx`; `tasks/page.tsx` and `couriers/page.tsx` remain server components (auth/redirect). Data loads in batches (20 tasks / 15 couriers) when the user scrolls to the bottom. Filter change → key changes → component remounts and resets the list. Courier ratings and stats load incrementally per batch. Added `@keyframes spin` to `globals.css` for the loading spinner.
==============

[2026-04-17 — Пагинация на страницах заданий и курьеров]
`tasks/page.tsx`: в `CourierFeed` добавлена URL-пагинация через `?page=N` (20 заданий за раз). Запрос использует `.range(from, to)` вместо загрузки всех записей. Кнопки «Назад/Далее» появляются только когда нужны. `CustomerActiveTasks` получил `.limit(50)` как защитный барьер. `couriers/page.tsx`: аналогичная пагинация (15 курьеров за раз). Оба компонента корректно обрабатывают edge-кейсы: пустую страницу > 0, сохранение фильтров в URL при навигации.
---
[2026-04-17 — Pagination on tasks and couriers pages]
`tasks/page.tsx`: added URL-based pagination via `?page=N` to `CourierFeed` (20 tasks per page). Query uses `.range(from, to)` instead of loading all records. Prev/Next buttons appear only when needed. `CustomerActiveTasks` gets `.limit(50)` as a safety guard. `couriers/page.tsx`: same pagination pattern (15 couriers per page). Both handle edge cases: empty page > 0, filter params preserved in URL during navigation.
==============

[2026-04-17 — Возврат 100₽ при отмене поручения]
`tasks/actions.ts` → `cancelTask`: при отмене поручения теперь автоматически возвращается комиссия 100₽ на кошелёк заказчика. Логика: атомарный UPDATE с `.select()` возвращает данные задания в одном запросе; баланс увеличивается на 100₽; в `transactions` записывается операция типа `refund`; заказчик получает уведомление типа `wallet` о возврате; если поручение было в статусе `matched` — курьер получает уведомление `task_cancelled`. Ранее деньги при отмене просто терялись.
---
[2026-04-17 — Refund 100₽ on task cancellation]
`tasks/actions.ts` → `cancelTask`: cancelling a task now automatically refunds the 100₽ placement fee to the customer's wallet. Logic: atomic UPDATE with `.select()` returns task data in one query; balance is incremented by 100₽; a `refund` transaction is recorded; customer receives a `wallet` notification; if the task was `matched`, the courier receives a `task_cancelled` notification. Previously the fee was simply lost on cancellation.
==============

[2026-04-17 — Добавлена колонка privacy_settings в profiles, фикс handleSave]
`delivem_schema.sql`: добавлена колонка `privacy_settings JSONB NOT NULL DEFAULT '{"show_phone":false,"show_bio":true,"show_birth_date":false}'` в таблицу `profiles` — колонка присутствовала в `types.ts` и использовалась в коде, но отсутствовала в схеме. `profile/page.tsx`: убран двухэтапный костыль в `handleSave` — теперь все поля (включая `birth_date` и `privacy_settings`) сохраняются одним атомарным запросом; удалено сообщение об ошибке с SQL-инструкцией. Создан файл миграции `supabase/migrations/add_privacy_settings_column.sql`.
---
[2026-04-17 — Added privacy_settings column to profiles, fixed handleSave]
`delivem_schema.sql`: added `privacy_settings JSONB NOT NULL DEFAULT '...'` column to `profiles` — the column was referenced in `types.ts` and used in code but missing from the schema. `profile/page.tsx`: removed two-step workaround in `handleSave` — all fields (including `birth_date` and `privacy_settings`) are now saved in a single atomic update; removed the error toast with inline SQL instructions. Migration file `supabase/migrations/add_privacy_settings_column.sql` created.
==============

[2026-04-17 — RLS политики для courier_profiles]
`delivem_schema.sql`: добавлены три отсутствующих RLS политики для таблицы `courier_profiles`. Ранее RLS была включена, но политик не было — таблица была полностью заблокирована для клиентских запросов. Теперь: `courier_profiles_public_read` — любой авторизованный пользователь может читать профили курьеров (нужно для страницы курьеров и деталей поручений); `courier_profiles_own_insert` — курьер может создать только свой профиль; `courier_profiles_own_update` — курьер может изменять только свой профиль. Создан файл миграции `supabase/migrations/add_courier_profiles_rls.sql`.
---
[2026-04-17 — RLS policies for courier_profiles]
`delivem_schema.sql`: added three missing RLS policies for the `courier_profiles` table. Previously RLS was enabled but no policies existed — the table was fully blocked for client-side queries. Now: `courier_profiles_public_read` — any authenticated user can read courier profiles (needed for the couriers list and task detail pages); `courier_profiles_own_insert` — courier can only create their own profile; `courier_profiles_own_update` — courier can only update their own profile. Migration file `supabase/migrations/add_courier_profiles_rls.sql` created.
==============

[2026-04-17 — Синхронизация схемы БД: добавлен статус awaiting_confirmation в enum]
`delivem_schema.sql`: в `task_status` ENUM добавлен пропущенный статус `awaiting_confirmation` (курьер завершил — ждёт подтверждения заказчика). Статус уже присутствовал в живой БД и в `types.ts`, но отсутствовал в файле схемы. Создан файл миграции `supabase/migrations/add_awaiting_confirmation_status.sql` с командой `ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation' BEFORE 'completed'` для применения на новых БД.
---
[2026-04-17 — DB schema sync: added awaiting_confirmation to task_status enum]
`delivem_schema.sql`: added missing `awaiting_confirmation` status to the `task_status` ENUM (courier marked done, awaiting customer confirmation). Status already existed in the live DB and `types.ts` but was absent from the schema file. Created migration file `supabase/migrations/add_awaiting_confirmation_status.sql` with `ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation' BEFORE 'completed'` for fresh DB setups.
==============

[2026-04-17 — Архив поручений: мгновенное переключение вкладок]
`orders/page.tsx` переписан как клиентский компонент. Все задания загружаются один раз при открытии страницы, фильтрация по вкладкам (Все/Выполнены/Отменены) происходит на клиенте без запросов к серверу. Устранена задержка 5 секунд при переключении вкладок на мобильных устройствах.
---
[2026-04-17 — Orders archive: instant tab switching]
`orders/page.tsx` rewritten as a client component. All tasks loaded once on mount, tab filtering (All/Completed/Cancelled) done client-side with no server requests. Eliminates 5-second delay when switching tabs on mobile.
==============

[2026-04-17 — Красивые скелетон-экраны загрузки для всех страниц]
Добавлена CSS-анимация `shimmer` в `globals.css` — волна бренд-цвета (#00236f светлая / #5b9bff тёмная) скользит по фону `--surface-variant`. Создан компонент `src/components/ui/Skeleton.tsx`. Все 11 файлов `loading.tsx` переписаны: каждый точно повторяет структуру своей страницы (карточки, аватары, кнопки, инпуты), автоматически адаптируется к светлой и тёмной теме через CSS-переменные.
---
[2026-04-17 — Beautiful shimmer skeleton loading screens for all pages]
Added `shimmer` CSS keyframe animation to `globals.css` — a brand-color highlight (#00236f light / #5b9bff dark) sweeps across `--surface-variant` backgrounds. Created `src/components/ui/Skeleton.tsx` reusable component. All 11 `loading.tsx` files rewritten with page-accurate layouts (cards, avatars, buttons, inputs), automatically adapting to both light and dark themes via CSS variables.
==============

[2026-04-17 — Оптимизация изображений аватара в профиле]
В `next.config.ts` добавлен `remotePatterns` для Supabase Storage (`*.supabase.co`). В `profile/page.tsx` тег `<img>` заменён на `<Image fill sizes="72px">` из `next/image` — аватар теперь автоматически оптимизируется (WebP/AVIF, lazy load, кеш CDN).
---
[2026-04-17 — Avatar image optimization in profile page]
Added `remotePatterns` for Supabase Storage (`*.supabase.co`) in `next.config.ts`. Replaced `<img>` with `<Image fill sizes="72px">` from `next/image` in `profile/page.tsx` — avatar is now automatically optimized (WebP/AVIF, lazy load, CDN cache).
==============

[2026-04-17 — Оптимизация запросов на дашборде]
В `dashboard/page.tsx` заменены `select('*')` на точные списки колонок. Профиль: `id, role, full_name, wallet_balance, city`. Задания: `id, title, from_address, to_address, status, task_type, reward, deadline, customer_id` + вложенные профили только `id, full_name`. Уменьшен объём данных передаваемых из БД на ~60–70%.
---
[2026-04-17 — Query optimization on dashboard]
Replaced `select('*')` with explicit column lists in `dashboard/page.tsx`. Profile: `id, role, full_name, wallet_balance, city`. Tasks: `id, title, from_address, to_address, status, task_type, reward, deadline, customer_id` + nested profiles only `id, full_name`. Reduces data transferred from DB by ~60–70%.
==============
[2026-04-18]
Добавлена поддержка клавиши Enter на форме регистрации: все текстовые поля (имя, фамилия, телефон, email, пароль) теперь запускают регистрацию по нажатию Enter. На форме входа Enter уже работал ранее.
---
[2026-04-18]
Added Enter key support to the registration form: all text fields (name, surname, phone, email, password) now trigger registration on Enter. Login form already had this.
==============
[2026-04-18]
Добавлен поиск заданий с расширенными фильтрами для курьеров:
- Новое поле `city` в таблице `tasks` (миграция add_city_to_tasks.sql) — список городов Абхазии: Гагра, Пицунда, Гудаута, Новый Афон, Сухум, Агудзера, Очамчыра, Ткуарчал, Гал
- В форму создания поручения добавлен выбор города
- FeedFilters переписан: фильтры по городу, типу задания, мин. и макс. оплате, срочности (дедлайн < 3 часов), сортировка (новые / оплата ↑↓)
- CourierFeed обновлён: поддержка всех новых URL-параметров в запросе
Добавлена страница рейтингов /ratings:
- Два таба: Курьеры (сортировка по рейтингу) и Заказчики (по числу завершённых поручений)
- Карточки с аватаром, рейтингом (звёзды), статистикой, городом, онлайн-статусом, транспортом
- Переход на профиль пользователя по клику
- Пункт "Рейтинги" (иконка leaderboard) добавлен в Sidebar и BottomNav для обеих ролей
---
[2026-04-18]
Added advanced task search filters for couriers:
- New `city` column in `tasks` table (migration add_city_to_tasks.sql) — Abkhazia cities list
- City selector added to task creation form
- FeedFilters rewritten: city, task type, min/max reward, urgency (deadline < 3h), sort order
- CourierFeed updated to support all new URL params
Added /ratings page:
- Two tabs: Couriers (sorted by rating) and Customers (sorted by completed tasks count)
- Cards with avatar, star rating, stats, city, online status, transport type
- Click through to user profile page
- "Ratings" menu item (leaderboard icon) added to Sidebar and BottomNav for both roles
==============
[2026-04-18]
Мобильные улучшения и исправления:
- Убран лишний отступ сверху на Android-устройствах без выреза (mobile-safe-spacer теперь использует только реальный safe-area-inset, без минимального значения 50px)
- Исправлена загрузка аватара с телефона: добавлено сжатие изображений через Canvas до 800px/300KB перед отправкой, исправлена обработка ошибок с детальным сообщением
- Страница рейтингов: количество выполненных заданий у курьеров теперь считается напрямую из таблицы tasks (не из кеша courier_profiles)
- Dashboard: карточки "Активные поручения" и "Выполнено всего" стали кликабельными с выразительной анимацией (↑ масштаб + тень), кнопки "Смотреть" убраны; кнопка "Пополнить" перемещена вправо в карточку баланса; добавлен класс stat-card-link
- allowedDevOrigins обновлён: добавлен новый IP 192.168.31.72
---
[2026-04-18]
Mobile improvements and fixes:
- Removed excessive top gap on Android phones without notch (mobile-safe-spacer now uses only real safe-area-inset, no 50px minimum)
- Fixed avatar upload on mobile: added Canvas image compression (max 800px/300KB), improved error messages
- Ratings page: courier completed task count now read directly from tasks table (not from stale courier_profiles cache)
- Dashboard: "Active tasks" and "Completed" stat cards are now clickable with expressive hover animation; "View" buttons removed; "Top up" button moved to right side of balance card; stat-card-link CSS class added
- allowedDevOrigins updated: added new IP 192.168.31.72
==============
[2026-04-18]
Обрезка аватара через react-image-crop:
- Добавлен компонент AvatarCropper (src/components/ui/AvatarCropper.tsx) с круговой обрезкой, ползунком масштаба и экспортом в JPEG 400×400px через Canvas
- Страница профиля теперь открывает модальное окно кроппера после выбора файла; готовый blob загружается в Supabase Storage
- Убрана зависимость от next/image на странице профиля (заменён на <img>) во избежание ошибок hostname
---
[2026-04-18]
Avatar cropping with react-image-crop:
- Added AvatarCropper component (src/components/ui/AvatarCropper.tsx) with circular crop, zoom slider, and Canvas JPEG 400×400px export
- Profile page now opens the cropper modal after file selection; the resulting blob is uploaded to Supabase Storage
- Removed next/image dependency on the profile page (replaced with <img>) to avoid hostname validation errors
==============

2026-04-20
Страница авторизации: добавлена поддержка отправки формы по нажатию Enter. На форме входа — Enter на полях email и пароля вызывает handleLogin(). На форме регистрации — Enter на поле пароля вызывает handleRegister().
---
Auth page: added Enter key support for form submission. On the login form — pressing Enter in the email or password fields triggers handleLogin(). On the registration form — pressing Enter in the password field triggers handleRegister().
==============

2026-04-20
Добавлена стартовая лендинг-страница (src/app/page.tsx + src/app/LandingClient.tsx): полноэкранный Hero с анимированным заголовком и CTA-кнопками, секция "Как это работает" (3 шага), секция преимуществ (4 карточки), секция статистики с анимированными счётчиками (данные из БД), встроенная форма входа/регистрации с glassmorphism-карточкой, фиксированный хедер с кнопками навигации и ThemeToggle, футер. Незалогиненные пользователи видят лендинг; залогиненные перенаправляются на /dashboard. Все блоки анимированы через IntersectionObserver при прокрутке. Адаптивная вёрстка для мобильных.
---
Added a full landing page (src/app/page.tsx + src/app/LandingClient.tsx): full-screen Hero with animated headline and CTA buttons, "How it works" section (3 steps), benefits section (4 cards), stats section with animated counters (live DB data), embedded login/register glass-card form, fixed header with navigation and ThemeToggle, footer. Unauthenticated users see the landing; authenticated users are redirected to /dashboard. All blocks animate in via IntersectionObserver on scroll. Fully responsive for mobile.
==============

2026-04-20
Доработка лендинга: изменён текст бейджа на "Работаем по всей Абхазии", уменьшен размер заголовка Hero для мобильных (clamp), скорректирован текст шага №3 — убрана фраза об автоматическом переводе, добавлена кнопка "Контакты" в футере со ссылкой на /contacts.
---
Landing page refinements: badge text changed to "Работаем по всей Абхазии", Hero headline font size reduced for mobile (clamp), step 3 description updated to remove automatic payment wording, Contacts button added to footer linking to /contacts.
==============

2026-04-20
Добавлены страницы правовых документов: /privacy (Политика конфиденциальности) и /terms (Условия использования). Оба документа оформлены в виде красивых карточек с иконками, секциями и списками. На странице /about добавлена карточка "Правовые документы" с кнопками-ссылками на оба документа.
---
Added legal document pages: /privacy (Privacy Policy) and /terms (Terms of Use). Both documents are styled as clean card-based layouts with icons, sections, and lists. The /about page now includes a "Legal documents" card with link buttons to both pages.
==============

[2026-04-20]
Оптимизация запросов к базе данных: параллельные запросы вместо последовательных (Promise.all), убраны select('*') — теперь запрашиваются только нужные поля. Затронуты: dashboard, tasks, tasks/[id], orders, active, CourierFeed.
---
Query performance optimization: parallel requests instead of sequential (Promise.all), removed select('*') in favor of explicit field lists. Affected: dashboard, tasks, tasks/[id], orders, active, CourierFeed.
==============

[2026-04-20]
Рефакторинг по результатам аудита: вынесен shared CitySelect (4 дублирующихся компонента → один), LandingClient.tsx разбит на 7 секций (~32 строки вместо 735), спиннеры заменены скелетонами в messages/orders/wallet, добавлена обработка ошибок БД в messages/orders/wallet, клиентская валидация в форме профиля, исправлены JSX-теги в tasks/[id].
---
Refactor per audit: shared CitySelect extracted (4 duplicates → one), LandingClient.tsx split into 7 sections (~32 lines vs 735), spinners replaced with skeletons in messages/orders/wallet, DB error handling added in messages/orders/wallet, client-side validation in profile form, fixed JSX tags in tasks/[id].
==============
