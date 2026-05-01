-- 状態チェック結果で「小ゴールを完了」した日に +5pt（1日1回）。メモ記録の +10pt とは別。
create table if not exists public.state_check_small_goal_completion (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create index if not exists state_check_small_goal_completion_day_key_idx
  on public.state_check_small_goal_completion (day_key desc);

alter table public.state_check_small_goal_completion enable row level security;

drop policy if exists "state_check_small_goal_completion_select_own"
  on public.state_check_small_goal_completion;
create policy "state_check_small_goal_completion_select_own"
on public.state_check_small_goal_completion
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "state_check_small_goal_completion_insert_own"
  on public.state_check_small_goal_completion;
create policy "state_check_small_goal_completion_insert_own"
on public.state_check_small_goal_completion
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on table public.state_check_small_goal_completion to authenticated;

notify pgrst, 'reload schema';
