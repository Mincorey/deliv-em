-- Add city column to tasks for city-based filtering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Сухум';

CREATE INDEX IF NOT EXISTS idx_tasks_city ON public.tasks(city);
