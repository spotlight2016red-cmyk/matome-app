-- Add user points (minimal, per-user).
-- We avoid altering auth.users directly; keep points in public.user_points.

create table if not exists public.user_points (
  user_id uuid primary key references auth.users (id) on delete cascade,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_points_updated_at_idx
  on public.user_points (updated_at desc);

-- Auto-update updated_at (function exists in schema.sql, but create if missing)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_points_updated_at on public.user_points;
create trigger trg_user_points_updated_at
before update on public.user_points
for each row execute function public.set_updated_at();

alter table public.user_points enable row level security;

-- Minimal RLS for self access (authenticated users).
drop policy if exists "user_points_select_own" on public.user_points;
create policy "user_points_select_own"
on public.user_points
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_points_insert_own" on public.user_points;
create policy "user_points_insert_own"
on public.user_points
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_points_update_own" on public.user_points;
create policy "user_points_update_own"
on public.user_points
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- RPC: increment points for current user.
create or replace function public.increment_my_points(delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  new_points integer;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_points (user_id, points)
  values (uid, greatest(0, delta))
  on conflict (user_id)
  do update set points = public.user_points.points + greatest(0, delta);

  select points into new_points from public.user_points where user_id = uid;
  return new_points;
end;
$$;

revoke all on function public.increment_my_points(integer) from public;
grant execute on function public.increment_my_points(integer) to authenticated;

-- PostgREST schema cache reload (Supabase SQL editor compatible)
notify pgrst, 'reload schema';

