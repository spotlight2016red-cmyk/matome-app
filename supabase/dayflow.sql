-- Add "day flow" features: run_kind, day_key, and per-day summaries.
-- Run AFTER schema.sql (and after existing data is ok).

-- 1) diagnosis_runs: add timing tag + day key
alter table public.diagnosis_runs
  add column if not exists run_kind text not null default 'extra',
  add column if not exists day_key date not null default ((now() at time zone 'Asia/Tokyo')::date);

create index if not exists diagnosis_runs_day_key_idx
  on public.diagnosis_runs (day_key);

create index if not exists diagnosis_runs_run_kind_idx
  on public.diagnosis_runs (run_kind);

-- 2) per-day lightweight summaries (ズレ/戻れた/明日の一手)
create table if not exists public.day_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day_key date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  drift_text text null,
  recovered_text text null,
  tomorrow_step_text text null,

  unique (user_id, day_key)
);

create index if not exists day_summaries_day_key_idx
  on public.day_summaries (day_key desc);

create index if not exists day_summaries_user_id_idx
  on public.day_summaries (user_id);

drop trigger if exists trg_day_summaries_updated_at on public.day_summaries;
create trigger trg_day_summaries_updated_at
before update on public.day_summaries
for each row execute function public.set_updated_at();

