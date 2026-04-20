-- Migration: add 'awaiting_confirmation' to task_status enum
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation' BEFORE 'completed';
