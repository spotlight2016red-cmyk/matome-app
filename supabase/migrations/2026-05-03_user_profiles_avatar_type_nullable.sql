-- 未診断を default 'explorer' と区別する（null = 未診断、画像だけ explorer にフォールバックはアプリ側）。
-- 既に 2026-04-30_make_avatar_type_nullable を適用済みでも安全に再実行できる。

alter table if exists public.user_profiles
  alter column avatar_type drop default;

alter table if exists public.user_profiles
  alter column avatar_type drop not null;

notify pgrst, 'reload schema';
