-- Function to increment courier task counters after completion
CREATE OR REPLACE FUNCTION increment_courier_tasks(courier_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.courier_profiles
  SET
    total_tasks     = total_tasks + 1,
    completed_tasks = completed_tasks + 1
  WHERE id = courier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
