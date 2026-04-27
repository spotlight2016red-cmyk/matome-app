-- Hotfix: add run_kind column to diagnosis_runs.
-- This is required by the app (POST /api/diagnosis).

alter table public.diagnosis_runs
  add column if not exists run_kind text default 'extra';

-- PostgREST schema cache reload (Supabase SQL editor compatible)
notify pgrst, 'reload schema';

