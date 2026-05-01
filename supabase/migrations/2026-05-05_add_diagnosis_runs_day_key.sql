-- diagnosis_runs.day_key（dayflow.sql と同等）。未適用のプロジェクトで GET /api/diagnosis が 500 になるのを防ぐ。

alter table public.diagnosis_runs
  add column if not exists day_key date not null default ((now() at time zone 'Asia/Tokyo')::date);

create index if not exists diagnosis_runs_day_key_idx
  on public.diagnosis_runs (day_key);

notify pgrst, 'reload schema';
