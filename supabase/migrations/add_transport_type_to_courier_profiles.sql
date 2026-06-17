-- Add transport_type column to courier_profiles if it doesn't exist
ALTER TABLE IF EXISTS public.courier_profiles
ADD COLUMN IF NOT EXISTS transport_type TEXT DEFAULT 'foot';

-- Create index if table exists
CREATE INDEX IF NOT EXISTS idx_courier_profiles_transport_type
ON public.courier_profiles(transport_type);
