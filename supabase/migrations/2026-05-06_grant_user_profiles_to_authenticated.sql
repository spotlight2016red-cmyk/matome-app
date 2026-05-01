-- PostgREST は JWT のロール `authenticated` でアクセスする。
-- RLS だけではなく、テーブルへの GRANT が無いと
-- 「permission denied for table user_profiles」になる。

grant select, insert, update on table public.user_profiles to authenticated;

notify pgrst, 'reload schema';
