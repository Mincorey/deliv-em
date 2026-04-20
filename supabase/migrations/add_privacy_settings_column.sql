-- Migration: add privacy_settings column to profiles table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB NOT NULL
  DEFAULT '{"show_phone":false,"show_bio":true,"show_birth_date":false}'::jsonb;
