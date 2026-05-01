-- 状態チェックで「診断結果を見る」まで完了した日に +1pt（1日1回）を付与するための記録。
create table if not exists public.state_check_daily_view_bonus (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create index if not exists state_check_daily_view_bonus_day_key_idx
  on public.state_check_daily_view_bonus (day_key desc);

alter table public.state_check_daily_view_bonus enable row level security;

drop policy if exists "state_check_daily_view_bonus_select_own"
  on public.state_check_daily_view_bonus;
create policy "state_check_daily_view_bonus_select_own"
on public.state_check_daily_view_bonus
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "state_check_daily_view_bonus_insert_own"
  on public.state_check_daily_view_bonus;
create policy "state_check_daily_view_bonus_insert_own"
on public.state_check_daily_view_bonus
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on table public.state_check_daily_view_bonus to authenticated;

notify pgrst, 'reload schema';
