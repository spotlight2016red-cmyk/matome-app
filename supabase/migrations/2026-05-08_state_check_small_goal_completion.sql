-- 状態チェック結果で「小ゴールを完了する」を押した記録（同一日1回）。
-- 目的:
-- - 小ゴール完了の +pt を重複付与しない
-- - 「完了」アクションの監査ログを残す

create table if not exists public.state_check_small_goal_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_key date not null,
  small_goal text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create index if not exists state_check_small_goal_completions_day_key_idx
  on public.state_check_small_goal_completions (day_key desc);

alter table public.state_check_small_goal_completions enable row level security;

drop policy if exists "state_check_small_goal_completions_select_own"
  on public.state_check_small_goal_completions;
create policy "state_check_small_goal_completions_select_own"
on public.state_check_small_goal_completions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "state_check_small_goal_completions_insert_own"
  on public.state_check_small_goal_completions;
create policy "state_check_small_goal_completions_insert_own"
on public.state_check_small_goal_completions
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on table public.state_check_small_goal_completions to authenticated;

notify pgrst, 'reload schema';

