# ROADMAP: Deliv'em v1.0

## Milestone 1: Foundation → Launch

---

### Phase 1: Project Setup & Design System
**Goal:** Next.js проект настроен, Tailwind config из прототипа, все общие компоненты готовы.

**Tasks:**
- 1.1 Инициализация Next.js 15 + TypeScript + Tailwind
- 1.2 Tailwind config (цвета, border-radius, fonts из прототипа)
- 1.3 Глобальные стили, шрифты (Inter, Material Symbols)
- 1.4 Базовые UI компоненты: Button, Input, Badge, Avatar, Modal, Toast
- 1.5 Layout компонент с Sidebar + Topbar
- 1.6 Supabase client setup (client + server + middleware)

**Done when:** `npm run dev` запускается, дизайн-система визуально идентична прототипу.

---

### Phase 2: Auth System
**Goal:** Пользователь может зарегистрироваться, войти, выйти. Роли customer/courier разграничены.

**Tasks:**
- 2.1 Страница `/auth` — форма входа/регистрации (перенос из прототипа)
- 2.2 Supabase Auth: signUp, signIn, signOut
- 2.3 Создание записи в `profiles` после регистрации (DB trigger или Server Action)
- 2.4 Создание `courier_profiles` для курьеров
- 2.5 Middleware: защищённые роуты → redirect на `/auth`
- 2.6 Контекст текущего пользователя (useUser hook / server session)

**Done when:** Регистрация создаёт профиль в Supabase, вход даёт доступ к `/dashboard`.

---

### Phase 3: Dashboard & Navigation
**Goal:** Рабочий дашборд с адаптацией по роли, навигация между страницами.

**Tasks:**
- 3.1 App Layout: Sidebar с роль-зависимой навигацией, Topbar
- 3.2 Customer Dashboard: статистика, активные поручения, кнопка создания
- 3.3 Courier Dashboard: рейтинг, статистика, превью ленты
- 3.4 Profile page: просмотр и редактирование данных
- 3.5 About page + Contacts/Feedback (сохранение в Supabase)
- 3.6 Notifications dropdown (realtime badge)

**Done when:** Оба типа пользователей видят свой дашборд с реальными данными из Supabase.

---

### Phase 4: Tasks — Customer Flow
**Goal:** Заказчик создаёт и управляет поручениями.

**Tasks:**
- 4.1 Страница `/tasks/create` — форма (тип, маршрут, вознаграждение, срок)
- 4.2 Server Action: создание поручения + списание 100₽ (транзакция)
- 4.3 Страница `/tasks` — список активных поручений заказчика
- 4.4 Страница `/tasks/[id]` — детальная страница поручения
- 4.5 Страница `/orders` — архив завершённых/отменённых
- 4.6 Действия: отменить поручение (если status=published/matched)
- 4.7 Task invitations: назначить избранному курьеру

**Done when:** Заказчик создаёт поручение, видит его в активных, может отменить.

---

### Phase 5: Tasks — Courier Flow
**Goal:** Курьер находит, принимает и выполняет поручения.

**Tasks:**
- 5.1 Страница `/tasks` (для courier) — лента с фильтрами (тип, город, мин. оплата)
- 5.2 Server Action: принять поручение (status → matched)
- 5.3 Server Action: начать выполнение (status → in_progress)
- 5.4 Server Action: завершить поручение (status → completed, выплата reward)
- 5.5 Страница `/tasks` (courier-active) — мои активные задания
- 5.6 Страница `/orders` — архив для курьера

**Done when:** Курьер берёт задание из ленты и доводит до завершения.

---

### Phase 6: Real-time Chat
**Goal:** Участники поручения переписываются в реальном времени.

**Tasks:**
- 6.1 Страница `/messages` — список чатов (чаты = поручения с перепиской)
- 6.2 Страница `/messages/[taskId]` — окно чата
- 6.3 Supabase Realtime подписка на `messages`
- 6.4 Server Action: отправить сообщение
- 6.5 Автоскролл к последнему сообщению
- 6.6 Badge непрочитанных в sidebar/topbar
- 6.7 Mark as read при открытии чата

**Done when:** Заказчик и курьер переписываются без перезагрузки страницы.

---

### Phase 7: Ratings & Wallet
**Goal:** Система оценок работает. Кошелёк пополняется через AnyPay.

**Tasks:**
- 7.1 Модал оценки после завершения поручения
- 7.2 Server Action: сохранить оценку (rating запись, пересчёт через trigger)
- 7.3 Страница `/wallet` — баланс + история транзакций
- 7.4 AnyPay integration: создать платёж, webhook подтверждения
- 7.5 Server Action: пополнить баланс (после webhook)
- 7.6 История транзакций с пагинацией

**Done when:** После завершения поручения оценки сохраняются; кошелёк пополняется через AnyPay.

---

### Phase 8: Couriers Directory & Favorites
**Goal:** Заказчик находит и добавляет курьеров в избранные.

**Tasks:**
- 8.1 Страница `/couriers` — список всех курьеров (сортировка/фильтр)
- 8.2 Карточка курьера с рейтингом, транспортом, bio
- 8.3 Кнопка "В избранное" — toggle (favorite_couriers)
- 8.4 Страница `/favorites` — избранные курьеры (customer) / заказчики (courier)
- 8.5 При создании поручения: выбор из избранных курьеров

**Done when:** Заказчик видит список курьеров, добавляет в избранные, назначает им задания.

---

### Phase 9: Polish & Production Readiness
**Goal:** Сайт готов к деплою на Vercel. Все edge cases обработаны.

**Tasks:**
- 9.1 Error boundaries + loading states (Suspense/Skeleton)
- 9.2 Form validation (Zod) на всех формах
- 9.3 Empty states для всех списков
- 9.4 SEO: metadata, OG tags
- 9.5 `.env.example` + Supabase setup guide (README)
- 9.6 Vercel deployment конфигурация
- 9.7 Финальный аудит RLS политик
- 9.8 Mobile navigation (bottom nav на mobile)

**Done when:** `vercel deploy` проходит, все страницы работают, нет критических ошибок.

---

## Phase Dependencies
```
1 → 2 → 3 → 4 → 5 → 6
                ↓       ↓
                7 → 8 → 9
```

## Tech Decisions
- **Next.js App Router** — Server Components для data fetching, Client для interactivity
- **Supabase SSR** — `@supabase/ssr` пакет для Server/Client разделения
- **Server Actions** — мутации данных (создание задач, отправка сообщений)
- **Tailwind** — утилитарный CSS, без CSS-in-JS
- **Zod** — runtime validation схем (переиспользует типы из БД)
