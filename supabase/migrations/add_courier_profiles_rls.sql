-- Migration: add RLS policies for courier_profiles table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE POLICY "courier_profiles_public_read" ON public.courier_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courier_profiles_own_insert" ON public.courier_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "courier_profiles_own_update" ON public.courier_profiles FOR UPDATE
  USING (auth.uid() = id);
