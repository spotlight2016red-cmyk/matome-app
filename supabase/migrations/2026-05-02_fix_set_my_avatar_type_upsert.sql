-- 2026-05-01 初版で insert(uid, null) していた DB 向けの修正。
-- avatar_type NOT NULL のとき「null value in column avatar_type violates not-null constraint」を防ぐ。
-- 内容は 2026-05-01 修正版と同じ（create or replace のため複数回適用しても安全）。

create or replace function public.set_my_avatar_type(new_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  t text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  t := lower(btrim(new_type));
  if t not in ('guide', 'healer', 'guardian', 'explorer', 'transformer') then
    raise exception 'Invalid avatar_type';
  end if;

  insert into public.user_profiles (user_id, avatar_type)
  values (uid, t)
  on conflict (user_id) do update
  set avatar_type = excluded.avatar_type;
end;
$$;

revoke all on function public.set_my_avatar_type(text) from public;
grant execute on function public.set_my_avatar_type(text) to authenticated;

notify pgrst, 'reload schema';
