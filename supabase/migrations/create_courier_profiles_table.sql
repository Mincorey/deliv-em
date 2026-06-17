-- Create courier_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.courier_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  transport_type TEXT DEFAULT 'foot',
  rating NUMERIC(3,2) DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "courier_profiles_public_read" ON public.courier_profiles;
DROP POLICY IF EXISTS "courier_profiles_own_insert" ON public.courier_profiles;
DROP POLICY IF EXISTS "courier_profiles_own_update" ON public.courier_profiles;

-- Create policies
CREATE POLICY "courier_profiles_public_read" ON public.courier_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courier_profiles_own_insert" ON public.courier_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "courier_profiles_own_update" ON public.courier_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_courier_profiles_rating ON public.courier_profiles(rating DESC);
