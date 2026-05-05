-- ════════════════════════════════════════════════════════════════════════════
-- Soft Delete System for critical tables
-- Allows record recovery without permanent deletion
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- Add deleted_at column to profiles
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Add deleted_at column to tasks
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(deleted_at) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Add deleted_at column to ratings
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE ratings ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_ratings_deleted_at ON ratings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ratings_active ON ratings(deleted_at) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Add deleted_at column to messages
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_active ON messages(deleted_at) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Add deleted_at column to feedback
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_feedback_deleted_at ON feedback(deleted_at);
CREATE INDEX IF NOT EXISTS idx_feedback_active ON feedback(deleted_at) WHERE deleted_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- RLS Policies to hide deleted records
-- ════════════════════════════════════════════════════════════════════════════

-- Profiles: Hide deleted profiles from regular queries
DROP POLICY IF EXISTS "Hide deleted profiles" ON profiles;
CREATE POLICY "Hide deleted profiles" ON profiles
  FOR SELECT
  USING (deleted_at IS NULL);

-- Tasks: Hide deleted tasks
DROP POLICY IF EXISTS "Hide deleted tasks" ON tasks;
CREATE POLICY "Hide deleted tasks" ON tasks
  FOR SELECT
  USING (deleted_at IS NULL);

-- Ratings: Hide deleted ratings
DROP POLICY IF EXISTS "Hide deleted ratings" ON ratings;
CREATE POLICY "Hide deleted ratings" ON ratings
  FOR SELECT
  USING (deleted_at IS NULL);

-- Messages: Hide deleted messages
DROP POLICY IF EXISTS "Hide deleted messages" ON messages;
CREATE POLICY "Hide deleted messages" ON messages
  FOR SELECT
  USING (deleted_at IS NULL);

-- Feedback: Hide deleted feedback
DROP POLICY IF EXISTS "Hide deleted feedback" ON feedback;
CREATE POLICY "Hide deleted feedback" ON feedback
  FOR SELECT
  USING (deleted_at IS NULL);

-- ════════════════════════════════════════════════════════════════════════════
-- Helper Functions for Soft Delete Operations
-- ════════════════════════════════════════════════════════════════════════════

-- Function: Soft delete a record (generic)
CREATE OR REPLACE FUNCTION soft_delete(table_name text, record_id uuid)
RETURNS boolean AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = now() WHERE id = %L AND deleted_at IS NULL', table_name, record_id);
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Restore a soft-deleted record (generic)
CREATE OR REPLACE FUNCTION restore_deleted(table_name text, record_id uuid)
RETURNS boolean AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = %L AND deleted_at IS NOT NULL', table_name, record_id);
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Permanently delete a soft-deleted record (only admin)
CREATE OR REPLACE FUNCTION permanently_delete(table_name text, record_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Only allow if record is already soft-deleted
  EXECUTE format('DELETE FROM %I WHERE id = %L AND deleted_at IS NOT NULL', table_name, record_id);
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- Views for easier data access (automatically exclude deleted records)
-- ════════════════════════════════════════════════════════════════════════════

-- Active profiles only
DROP VIEW IF EXISTS profiles_active CASCADE;
CREATE VIEW profiles_active AS
SELECT * FROM profiles WHERE deleted_at IS NULL;

-- Active tasks only
DROP VIEW IF EXISTS tasks_active CASCADE;
CREATE VIEW tasks_active AS
SELECT * FROM tasks WHERE deleted_at IS NULL;

-- Active ratings only
DROP VIEW IF EXISTS ratings_active CASCADE;
CREATE VIEW ratings_active AS
SELECT * FROM ratings WHERE deleted_at IS NULL;

-- Active messages only
DROP VIEW IF EXISTS messages_active CASCADE;
CREATE VIEW messages_active AS
SELECT * FROM messages WHERE deleted_at IS NULL;

-- Active feedback only
DROP VIEW IF EXISTS feedback_active CASCADE;
CREATE VIEW feedback_active AS
SELECT * FROM feedback WHERE deleted_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- Statistics Views
-- ════════════════════════════════════════════════════════════════════════════

-- View: Count of deleted records by table (for cleanup decisions)
CREATE OR REPLACE VIEW deleted_records_stats AS
SELECT
  'profiles' as table_name,
  COUNT(*) as deleted_count,
  MAX(deleted_at) as last_deleted_at
FROM profiles WHERE deleted_at IS NOT NULL

UNION ALL

SELECT
  'tasks' as table_name,
  COUNT(*) as deleted_count,
  MAX(deleted_at) as last_deleted_at
FROM tasks WHERE deleted_at IS NOT NULL

UNION ALL

SELECT
  'ratings' as table_name,
  COUNT(*) as deleted_count,
  MAX(deleted_at) as last_deleted_at
FROM ratings WHERE deleted_at IS NOT NULL

UNION ALL

SELECT
  'messages' as table_name,
  COUNT(*) as deleted_count,
  MAX(deleted_at) as last_deleted_at
FROM messages WHERE deleted_at IS NOT NULL

UNION ALL

SELECT
  'feedback' as table_name,
  COUNT(*) as deleted_count,
  MAX(deleted_at) as last_deleted_at
FROM feedback WHERE deleted_at IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- Important: Audit Log Integration
-- When soft delete happens, it's automatically logged because it's an UPDATE
-- The changed_fields in audit_log will show: ["deleted_at"]
-- ════════════════════════════════════════════════════════════════════════════

-- Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION soft_delete(text, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION restore_deleted(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete(text, uuid) TO authenticated;
