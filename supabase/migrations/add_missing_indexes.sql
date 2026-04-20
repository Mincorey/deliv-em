-- Migration: add missing indexes for performance
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Courier sorting by rating
CREATE INDEX IF NOT EXISTS idx_courier_profiles_rating ON public.courier_profiles(rating DESC);

-- Queries by user role (couriers list page)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Partial index for unread messages — much more efficient than full boolean index
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(task_id) WHERE is_read = false;
