-- 今日の1歩：完了後の任意メモ
alter table public.goal_today_actions add column if not exists completion_note text null;

notify pgrst, 'reload schema';
