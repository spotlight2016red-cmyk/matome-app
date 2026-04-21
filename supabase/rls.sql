-- Enable Row Level Security for per-user data ownership.
-- Run AFTER schema.sql.

alter table public.diagnosis_runs enable row level security;
alter table public.goal_maps enable row level security;

-- diagnosis_runs policies
drop policy if exists "diagnosis_runs_select_own" on public.diagnosis_runs;
create policy "diagnosis_runs_select_own"
on public.diagnosis_runs
for select
using (auth.uid() = user_id);

drop policy if exists "diagnosis_runs_insert_own" on public.diagnosis_runs;
create policy "diagnosis_runs_insert_own"
on public.diagnosis_runs
for insert
with check (auth.uid() = user_id);

drop policy if exists "diagnosis_runs_update_own" on public.diagnosis_runs;
create policy "diagnosis_runs_update_own"
on public.diagnosis_runs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnosis_runs_delete_own" on public.diagnosis_runs;
create policy "diagnosis_runs_delete_own"
on public.diagnosis_runs
for delete
using (auth.uid() = user_id);

-- goal_maps policies
drop policy if exists "goal_maps_select_own" on public.goal_maps;
create policy "goal_maps_select_own"
on public.goal_maps
for select
using (auth.uid() = user_id);

drop policy if exists "goal_maps_insert_own" on public.goal_maps;
create policy "goal_maps_insert_own"
on public.goal_maps
for insert
with check (auth.uid() = user_id);

drop policy if exists "goal_maps_update_own" on public.goal_maps;
create policy "goal_maps_update_own"
on public.goal_maps
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goal_maps_delete_own" on public.goal_maps;
create policy "goal_maps_delete_own"
on public.goal_maps
for delete
using (auth.uid() = user_id);

