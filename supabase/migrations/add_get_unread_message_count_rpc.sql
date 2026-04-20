-- Migration: add get_unread_message_count RPC function
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.messages m
  JOIN public.tasks t ON t.id = m.task_id
  WHERE m.is_read    = false
    AND m.sender_id != p_user_id
    AND (t.customer_id = p_user_id OR t.courier_id = p_user_id)
$$ LANGUAGE sql SECURITY DEFINER STABLE;
