-- RLS policies for day_summaries, and ownership checks.
-- Run AFTER rls.sql and dayflow.sql.

alter table public.day_summaries enable row level security;

drop policy if exists "day_summaries_select_own" on public.day_summaries;
create policy "day_summaries_select_own"
on public.day_summaries
for select
using (auth.uid() = user_id);

drop policy if exists "day_summaries_insert_own" on public.day_summaries;
create policy "day_summaries_insert_own"
on public.day_summaries
for insert
with check (auth.uid() = user_id);

drop policy if exists "day_summaries_update_own" on public.day_summaries;
create policy "day_summaries_update_own"
on public.day_summaries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "day_summaries_delete_own" on public.day_summaries;
create policy "day_summaries_delete_own"
on public.day_summaries
for delete
using (auth.uid() = user_id);

