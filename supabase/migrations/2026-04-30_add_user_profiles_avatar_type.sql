-- Add user profile (minimal) with avatar_type.
-- Keep user-bound persistent data out of auth.users.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avatar_type text not null default 'explorer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_avatar_type_check
    check (avatar_type in ('guide', 'healer', 'guardian', 'explorer', 'transformer'))
);

create index if not exists user_profiles_updated_at_idx
  on public.user_profiles (updated_at desc);

-- Auto-update updated_at (function exists, but create if missing)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- RPC: ensure profile row exists and return avatar_type.
create or replace function public.ensure_my_profile()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  av text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_profiles (user_id, avatar_type)
  values (uid, 'explorer')
  on conflict (user_id) do nothing;

  select avatar_type into av from public.user_profiles where user_id = uid;
  return av;
end;
$$;

revoke all on function public.ensure_my_profile() from public;
grant execute on function public.ensure_my_profile() to authenticated;

notify pgrst, 'reload schema';

