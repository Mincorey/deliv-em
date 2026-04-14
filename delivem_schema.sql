-- ============================================================
-- Deliv'em — Supabase Database Schema
-- Единая БД для сайта и мобильного приложения
-- Республика Абхазия
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ──────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'courier');

CREATE TYPE task_type AS ENUM (
  'documents',    -- Документы
  'groceries',    -- Продукты
  'materials',    -- Материалы
  'gift',         -- Подарок/Цветы
  'meeting',      -- Встреча
  'parcel'        -- Посылка
);

CREATE TYPE task_status AS ENUM (
  'draft',        -- Черновик (не оплачен)
  'published',    -- Опубликован — виден курьерам, свободен
  'matched',      -- Принят курьером, ожидает старта
  'in_progress',  -- Выполняется
  'completed',    -- Выполнен
  'cancelled'     -- Отменён
);

CREATE TYPE transaction_type AS ENUM (
  'top_up',       -- Пополнение кошелька
  'task_fee',     -- Комиссия за размещение поручения (100 руб.)
  'payout',       -- Выплата курьеру
  'refund'        -- Возврат
);

CREATE TYPE transport_type AS ENUM (
  'foot',         -- Пешком
  'bicycle',      -- Велосипед
  'motorcycle',   -- Мотоцикл
  'car',          -- Автомобиль
  'truck'         -- Грузовик
);

-- ──────────────────────────────────────────────────────────────
-- 2. USERS
-- Расширяет auth.users Supabase
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  city            TEXT NOT NULL DEFAULT 'Сухум',  -- Города Абхазии
  avatar_url      TEXT,
  bio             TEXT,
  birth_date      DATE,                              -- Дата рождения
  has_car         BOOLEAN NOT NULL DEFAULT FALSE,    -- Наличие автомобиля
  wallet_balance  NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0),
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  push_token      TEXT,         -- Для мобильных push-уведомлений
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 3. COURIER PROFILES (доп. поля только для курьеров)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.courier_profiles (
  id               UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  transport_type   transport_type NOT NULL DEFAULT 'foot',
  rating           NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  total_tasks      INT NOT NULL DEFAULT 0,
  completed_tasks  INT NOT NULL DEFAULT 0,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,   -- онлайн/оффлайн
  current_lat      DOUBLE PRECISION,                -- текущая геопозиция
  current_lng      DOUBLE PRECISION,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER courier_profiles_updated_at
  BEFORE UPDATE ON public.courier_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 4. TASKS (Поручения)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  courier_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  title           TEXT NOT NULL,
  description     TEXT,
  task_type       task_type NOT NULL,
  status          task_status NOT NULL DEFAULT 'draft',

  -- Вознаграждение курьера (устанавливает заказчик)
  reward          NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (reward >= 0),

  -- Адреса
  from_address    TEXT NOT NULL,
  from_lat        DOUBLE PRECISION,
  from_lng        DOUBLE PRECISION,
  to_address      TEXT NOT NULL,
  to_lat          DOUBLE PRECISION,
  to_lng          DOUBLE PRECISION,

  -- Время
  deadline        TIMESTAMPTZ,                  -- до какого времени выполнить
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  -- Служебное
  placement_fee   NUMERIC(10, 2) NOT NULL DEFAULT 100.00, -- комиссия сервиса
  is_private      BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = только для избранных курьеров

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Индексы для производительности
CREATE INDEX idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX idx_tasks_courier_id  ON public.tasks(courier_id);
CREATE INDEX idx_tasks_status      ON public.tasks(status);
CREATE INDEX idx_tasks_created_at  ON public.tasks(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 5. TASK_INVITATIONS (Приглашения избранных курьеров)
-- Заказчик может направить поручение конкретному курьеру
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.task_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  courier_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | declined
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, courier_id)
);

-- ──────────────────────────────────────────────────────────────
-- 6. FAVORITES
-- ──────────────────────────────────────────────────────────────

-- Избранные курьеры заказчика
CREATE TABLE public.favorite_couriers (
  customer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  courier_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, courier_id)
);

-- Избранные заказчики курьера
CREATE TABLE public.favorite_customers (
  courier_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (courier_id, customer_id)
);

-- ──────────────────────────────────────────────────────────────
-- 7. MESSAGES (Чат внутри поручения)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_task_id   ON public.messages(task_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 8. RATINGS (Рейтинговая система)
-- После завершения поручения обе стороны оценивают друг друга
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  from_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score         SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, from_user_id)  -- одна оценка за задание от одного пользователя
);

-- Автоматически пересчитываем рейтинг курьера после новой оценки
CREATE OR REPLACE FUNCTION update_courier_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.courier_profiles
  SET rating = (
    SELECT ROUND(AVG(r.score)::NUMERIC, 2)
    FROM public.ratings r
    WHERE r.to_user_id = NEW.to_user_id
  )
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_courier_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_courier_rating();

-- ──────────────────────────────────────────────────────────────
-- 9. TRANSACTIONS (Транзакции кошелька)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  type             transaction_type NOT NULL,
  amount           NUMERIC(10, 2) NOT NULL,          -- положительное = приход
  balance_after    NUMERIC(10, 2) NOT NULL,
  description      TEXT,
  anypay_order_id  TEXT,                             -- ID платежа AnyPay
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id    ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 10. NOTIFICATIONS (Уведомления)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,    -- task_published | task_accepted | task_completed | message | rating
  title       TEXT NOT NULL,
  body        TEXT,
  task_id     UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- ──────────────────────────────────────────────────────────────
-- 11. FEEDBACK (Обратная связь с разработчиком)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 12. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_invitations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_couriers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_customers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback            ENABLE ROW LEVEL SECURITY;

-- Профиль: пользователь видит свой профиль; курьеры видны всем
CREATE POLICY "profiles_self" ON public.profiles FOR ALL
  USING (auth.uid() = id);
CREATE POLICY "profiles_couriers_public" ON public.profiles FOR SELECT
  USING (role = 'courier');

-- Поручения: заказчик видит свои; курьеры видят опубликованные
CREATE POLICY "tasks_customer_own" ON public.tasks FOR ALL
  USING (auth.uid() = customer_id);
CREATE POLICY "tasks_courier_published" ON public.tasks FOR SELECT
  USING (status IN ('published', 'matched') AND auth.uid() != customer_id);
CREATE POLICY "tasks_courier_own" ON public.tasks FOR SELECT
  USING (auth.uid() = courier_id);

-- Сообщения: только участники задания
CREATE POLICY "messages_participants" ON public.messages FOR ALL
  USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT customer_id FROM public.tasks WHERE id = task_id
      UNION
      SELECT courier_id  FROM public.tasks WHERE id = task_id
    )
  );

-- Кошелёк: только свои транзакции
CREATE POLICY "transactions_own" ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Уведомления: только свои
CREATE POLICY "notifications_own" ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- Оценки: участники задания
CREATE POLICY "ratings_own" ON public.ratings FOR ALL
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Избранные
CREATE POLICY "fav_couriers_own"   ON public.favorite_couriers  FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "fav_customers_own"  ON public.favorite_customers FOR ALL USING (auth.uid() = courier_id);

-- Обратная связь: только чтение своего, запись открыта
CREATE POLICY "feedback_own" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_insert" ON public.feedback FOR INSERT WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 13. REALTIME (для чата и живого обновления статусов)
-- ──────────────────────────────────────────────────────────────

-- Включить в Supabase Dashboard → Database → Replication:
-- public.messages
-- public.tasks
-- public.notifications
-- public.courier_profiles (для геопозиции)

-- ──────────────────────────────────────────────────────────────
-- 14. СПРАВОЧНЫЕ ДАННЫЕ: города Абхазии
-- ──────────────────────────────────────────────────────────────

CREATE TABLE public.cities (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  lat   DOUBLE PRECISION,
  lng   DOUBLE PRECISION
);

INSERT INTO public.cities (name, lat, lng) VALUES
  ('Сухум',     43.0015, 41.0234),
  ('Гагра',     43.3215, 40.2647),
  ('Гудаута',   43.1013, 40.5688),
  ('Новый Афон',43.0888, 40.8219),
  ('Очамчыра',  42.7097, 41.4636),
  ('Ткуарчал',  42.8659, 41.6763),
  ('Гал',       42.5219, 41.7669),
  ('Пицунда',   43.1578, 40.3361);
