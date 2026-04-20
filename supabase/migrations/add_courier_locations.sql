create table if not exists public.courier_locations (
  courier_id  uuid primary key references public.profiles(id) on delete cascade,
  task_id     uuid references public.tasks(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  updated_at  timestamptz not null default now()
);

alter table public.courier_locations enable row level security;

-- Courier can upsert their own location
create policy "courier_manage_own_location" on public.courier_locations
  for all
  using  (auth.uid() = courier_id)
  with check (auth.uid() = courier_id);

-- Authenticated users can read locations (customer checks task ownership in app)
create policy "authenticated_read_locations" on public.courier_locations
  for select
  using (auth.role() = 'authenticated');

-- Enable realtime for this table
alter publication supabase_realtime add table public.courier_locations;
