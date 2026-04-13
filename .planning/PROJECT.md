# PROJECT: Deliv'em

## Vision
Deliv'em — первая P2P-платформа микропоручений в Республике Абхазия. Веб-приложение соединяет заказчиков (людей с задачей) и курьеров (исполнителей), обеспечивая безопасную оплату через внутренний кошелёк и AnyPay.

## Source
Существующий прототип: `index.html` — полноценный SPA-макет с mock-данными и проработанным UI/UX.
Схема БД: `delivem_schema.sql` — готовая Supabase схема.

**Задача:** Превратить одностраничный прототип в полноценный многостраничный продакшн-сайт с реальной Supabase-интеграцией.

## Target Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS 3 (config из прототипа), Material Symbols, Inter
- **Backend:** Supabase (Auth, DB/RLS, Realtime, Storage)
- **Payment:** AnyPay API (пополнение кошелька)
- **Maps:** Яндекс Карты API (адреса, маршруты)
- **Deploy:** Vercel

## Roles
- **customer** — Заказчик: создаёт поручения, пополняет кошелёк, оценивает курьеров
- **courier** — Курьер: берёт задания из ленты, получает выплаты, строит рейтинг

## Pages (routes)
| Route | Description |
|-------|-------------|
| `/` | Лендинг → редирект на `/dashboard` если залогинен |
| `/auth` | Вход / Регистрация |
| `/dashboard` | Дашборд (customer или courier по роли) |
| `/tasks` | customer: Активные поручения / courier: Лента заданий |
| `/tasks/create` | Создать поручение (только customer) |
| `/tasks/[id]` | Детальная страница поручения |
| `/orders` | Архив завершённых поручений |
| `/couriers` | Список курьеров (только customer) |
| `/favorites` | Избранные (курьеры для customer / заказчики для courier) |
| `/messages` | Список чатов |
| `/messages/[id]` | Чат по поручению (realtime) |
| `/wallet` | Кошелёк + история транзакций (только customer) |
| `/profile` | Настройки профиля |
| `/about` | О сервисе |
| `/contacts` | Обратная связь |

## Database (Supabase)
Полная схема готова в `delivem_schema.sql`:
- `profiles` — расширение auth.users
- `courier_profiles` — доп. поля курьеров
- `tasks` — поручения
- `task_invitations` — приглашения избранных курьеров
- `favorite_couriers` / `favorite_customers`
- `messages` — чат внутри поручения (realtime)
- `ratings` — оценки обеих сторон
- `transactions` — история кошелька
- `notifications` — уведомления
- `feedback` — обратная связь
- `cities` — города Абхазии

## Key Features
- Auth через Supabase Auth (email/password)
- RLS — каждый видит только своё
- Realtime чат (Supabase Realtime)
- Кошелёк: пополнение через AnyPay, списание комиссии 100₽
- Рейтинговая система после завершения
- Уведомления в реальном времени
- Адаптивный дизайн (mobile-first)
- Тёмная тема (заложена в Tailwind config)

## Design System (из прототипа)
- Primary: `#00236f` (тёмно-синий)
- Secondary: `#006c49` (зелёный)
- Surface: `#f7f9fb`
- Material Symbols Outlined
- Border radius: 1rem default, full для кнопок
- Glass morphism эффекты
- Градиенты primary→secondary

## Success Criteria
- Пользователь может зарегистрироваться и войти
- Заказчик создаёт и публикует поручение (списывается 100₽)
- Курьер видит поручение в ленте и берёт его
- Оба могут переписываться в реалтайм чате
- После завершения оба оставляют оценки
- Кошелёк реально пополняется через AnyPay
