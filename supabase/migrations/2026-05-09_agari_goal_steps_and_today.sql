-- AGARI ゴール: 大・中・小 の任意期日、「1歩」プール、「今日の1歩」行動ログ

alter table public.goal_maps add column if not exists big_goal_due_on date;
alter table public.goal_maps add column if not exists middle_goal_due_on date;
alter table public.goal_maps add column if not exists small_goal_due_on date;

create table if not exists public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  goal_map_id uuid not null references public.goal_maps (id) on delete cascade,
  step_kind text not null check (step_kind in ('fixed', 'variable')),
  title text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_steps_goal_map_sort_idx
  on public.goal_steps (goal_map_id, sort_order asc, created_at asc);

drop trigger if exists trg_goal_steps_updated_at on public.goal_steps;
create trigger trg_goal_steps_updated_at
before update on public.goal_steps
for each row execute function public.set_updated_at();

alter table public.goal_steps enable row level security;

drop policy if exists "goal_steps_select_own" on public.goal_steps;
create policy "goal_steps_select_own"
on public.goal_steps
for select
to authenticated
using (
  exists (
    select 1 from public.goal_maps g
    where g.id = goal_steps.goal_map_id and g.user_id = auth.uid()
  )
);

drop policy if exists "goal_steps_insert_own" on public.goal_steps;
create policy "goal_steps_insert_own"
on public.goal_steps
for insert
to authenticated
with check (
  exists (
    select 1 from public.goal_maps g
    where g.id = goal_steps.goal_map_id and g.user_id = auth.uid()
  )
);

drop policy if exists "goal_steps_update_own" on public.goal_steps;
create policy "goal_steps_update_own"
on public.goal_steps
for update
to authenticated
using (
  exists (
    select 1 from public.goal_maps g
    where g.id = goal_steps.goal_map_id and g.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.goal_maps g
    where g.id = goal_steps.goal_map_id and g.user_id = auth.uid()
  )
);

drop policy if exists "goal_steps_delete_own" on public.goal_steps;
create policy "goal_steps_delete_own"
on public.goal_steps
for delete
to authenticated
using (
  exists (
    select 1 from public.goal_maps g
    where g.id = goal_steps.goal_map_id and g.user_id = auth.uid()
  )
);

grant select, insert, update, delete on table public.goal_steps to authenticated;

-- 今日の1歩（同一ゴール・同一日に複数行可）
create table if not exists public.goal_today_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_map_id uuid not null references public.goal_maps (id) on delete cascade,
  day_key date not null,
  title text not null default '',
  origin text not null check (origin in ('fixed_pick', 'variable_pick', 'diagnosis', 'manual')),
  linked_step_id uuid null references public.goal_steps (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_today_actions_user_day_idx
  on public.goal_today_actions (user_id, day_key desc, created_at desc);

create index if not exists goal_today_actions_goal_day_idx
  on public.goal_today_actions (goal_map_id, day_key desc);

drop trigger if exists trg_goal_today_actions_updated_at on public.goal_today_actions;
create trigger trg_goal_today_actions_updated_at
before update on public.goal_today_actions
for each row execute function public.set_updated_at();

alter table public.goal_today_actions enable row level security;

drop policy if exists "goal_today_actions_select_own" on public.goal_today_actions;
create policy "goal_today_actions_select_own"
on public.goal_today_actions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "goal_today_actions_insert_own" on public.goal_today_actions;
create policy "goal_today_actions_insert_own"
on public.goal_today_actions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "goal_today_actions_update_own" on public.goal_today_actions;
create policy "goal_today_actions_update_own"
on public.goal_today_actions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goal_today_actions_delete_own" on public.goal_today_actions;
create policy "goal_today_actions_delete_own"
on public.goal_today_actions
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.goal_today_actions to authenticated;

-- 完了1歩あたり1回だけポイント用
create table if not exists public.goal_today_action_point_awards (
  today_action_id uuid primary key references public.goal_today_actions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.goal_today_action_point_awards enable row level security;

drop policy if exists "goal_today_action_point_awards_select_own"
  on public.goal_today_action_point_awards;
create policy "goal_today_action_point_awards_select_own"
on public.goal_today_action_point_awards
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "goal_today_action_point_awards_insert_own"
  on public.goal_today_action_point_awards;
create policy "goal_today_action_point_awards_insert_own"
on public.goal_today_action_point_awards
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on table public.goal_today_action_point_awards to authenticated;

notify pgrst, 'reload schema';
