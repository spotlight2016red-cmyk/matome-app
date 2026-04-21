-- Supabase schema for "育つ診断" (initial server-persisted version)
-- Notes:
-- - user_id is nullable (phase1: authなしでも動く)
-- - When enabling Supabase Auth + RLS later, make user_id NOT NULL and add policies.

create extension if not exists "pgcrypto";

create table if not exists public.diagnosis_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  created_at timestamptz not null default now(),

  result_type text not null,
  propulsion_score int not null,
  fatigue_score int not null,
  confusion_score int not null,
  recovery_score int not null,
  heat_score int not null default 0,

  answers_json jsonb not null,

  result_summary text not null,
  primary_action text not null,
  recovery_actions_json jsonb not null,

  heat_mode_title text null,
  heat_mode_body text null,
  heat_mode_actions_json jsonb null,

  note_text text null
);

create index if not exists diagnosis_runs_created_at_idx
  on public.diagnosis_runs (created_at desc);

create index if not exists diagnosis_runs_user_id_idx
  on public.diagnosis_runs (user_id);

create table if not exists public.goal_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  big_goal text not null default '',
  middle_goal text not null default '',
  small_goal text not null default '',

  big_goal_purpose text null,
  middle_goal_purpose text null,
  small_goal_purpose text null,

  success_criteria text null
);

create index if not exists goal_maps_updated_at_idx
  on public.goal_maps (updated_at desc);

create index if not exists goal_maps_user_id_idx
  on public.goal_maps (user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_goal_maps_updated_at on public.goal_maps;
create trigger trg_goal_maps_updated_at
before update on public.goal_maps
for each row execute function public.set_updated_at();

