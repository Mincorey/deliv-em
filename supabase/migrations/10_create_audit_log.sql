-- ════════════════════════════════════════════════════════════════════════════
-- Audit Log System for tracking all changes in critical tables
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id uuid,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[] DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_composite ON audit_log(table_name, record_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- PL/pgSQL Function for Audit Logging
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields text[];
  col_name text;
  old_val jsonb;
  new_val jsonb;
BEGIN
  -- Определяем user_id из контекста (если доступен)
  DECLARE user_id uuid;
  BEGIN
    user_id := (current_setting('app.current_user_id', true))::uuid;
  EXCEPTION WHEN OTHERS THEN
    user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(
      table_name, record_id, operation, user_id,
      old_values, changed_fields, created_at
    ) VALUES (
      TG_TABLE_NAME, OLD.id, 'DELETE', user_id,
      to_jsonb(OLD), ARRAY[]::text[], now()
    );
    RETURN OLD;

  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(
      table_name, record_id, operation, user_id,
      new_values, changed_fields, created_at
    ) VALUES (
      TG_TABLE_NAME, NEW.id, 'INSERT', user_id,
      to_jsonb(NEW), ARRAY[]::text[], now()
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Определяем какие поля изменились
    FOR col_name IN
      SELECT key FROM jsonb_each(to_jsonb(NEW))
    LOOP
      old_val := to_jsonb(OLD) -> col_name;
      new_val := to_jsonb(NEW) -> col_name;

      IF COALESCE(old_val, 'null'::jsonb) != COALESCE(new_val, 'null'::jsonb) THEN
        changed_fields := array_append(changed_fields, col_name);
      END IF;
    END LOOP;

    INSERT INTO audit_log(
      table_name, record_id, operation, user_id,
      old_values, new_values, changed_fields, created_at
    ) VALUES (
      TG_TABLE_NAME, NEW.id, 'UPDATE', user_id,
      to_jsonb(OLD), to_jsonb(NEW), changed_fields, now()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- Enable RLS on audit_log for security
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view audit logs
CREATE POLICY "Authenticated users can view audit logs" ON audit_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system can insert into audit logs
CREATE POLICY "System can insert audit logs" ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════════════
-- Create Triggers for Critical Tables
-- ════════════════════════════════════════════════════════════════════════════

-- Trigger for transactions table (CRITICAL - финансовые операции)
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
CREATE TRIGGER audit_transactions_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Trigger for ratings table
DROP TRIGGER IF EXISTS audit_ratings_trigger ON ratings;
CREATE TRIGGER audit_ratings_trigger
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Trigger for tasks table (важные изменения статуса)
DROP TRIGGER IF EXISTS audit_tasks_trigger ON tasks;
CREATE TRIGGER audit_tasks_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Trigger for profiles table (изменения персональных данных)
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ════════════════════════════════════════════════════════════════════════════
-- Helper Views for easier querying
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW audit_log_recent AS
SELECT
  id,
  table_name,
  record_id,
  operation,
  user_id,
  changed_fields,
  created_at,
  created_at AT TIME ZONE 'UTC' AS created_at_utc
FROM audit_log
ORDER BY created_at DESC
LIMIT 100;

-- View для транзакций с аудитом
CREATE OR REPLACE VIEW transactions_with_audit AS
SELECT
  t.*,
  CASE
    WHEN a.operation = 'INSERT' THEN 'Создано'
    WHEN a.operation = 'UPDATE' THEN 'Изменено'
    WHEN a.operation = 'DELETE' THEN 'Удалено'
  END AS last_change_type,
  a.user_id AS changed_by,
  a.created_at AS last_changed_at
FROM transactions t
LEFT JOIN audit_log a ON a.table_name = 'transactions' AND a.record_id = t.id
WHERE a.id IS NULL OR a.created_at = (
  SELECT MAX(created_at) FROM audit_log
  WHERE table_name = 'transactions' AND record_id = t.id
);
