-- Migration: add get_public_profile RPC — masks phone/bio/birth_date per privacy_settings
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE OR REPLACE FUNCTION get_public_profile(target_id UUID)
RETURNS JSON AS $$
DECLARE
  prof public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = target_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN json_build_object(
    'id',               prof.id,
    'role',             prof.role,
    'full_name',        prof.full_name,
    'city',             prof.city,
    'avatar_url',       prof.avatar_url,
    'is_verified',      prof.is_verified,
    'has_car',          prof.has_car,
    'created_at',       prof.created_at,
    'privacy_settings', prof.privacy_settings,
    'phone',
      CASE WHEN (prof.privacy_settings->>'show_phone')::boolean = true
        THEN prof.phone ELSE NULL END,
    'bio',
      CASE WHEN (prof.privacy_settings->>'show_bio')::boolean IS DISTINCT FROM false
        THEN prof.bio ELSE NULL END,
    'birth_date',
      CASE WHEN (prof.privacy_settings->>'show_birth_date')::boolean = true
        THEN prof.birth_date::text ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
