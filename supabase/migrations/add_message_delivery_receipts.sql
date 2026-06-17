-- Add delivery and read receipt timestamps to messages table
ALTER TABLE messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient queries on receipt status
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON messages(task_id, delivered_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(task_id, read_at);
