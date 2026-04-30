-- アバター型の保存を security definer RPC に統一する。
-- authenticated が user_profiles に対して UPDATE 権限を持たない環境で
-- 「permission denied for table user_profiles」になるのを防ぐ（初回・再診断の両方）。

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
  values (uid, null)
  on conflict (user_id) do nothing;

  update public.user_profiles
  set avatar_type = t
  where user_id = uid;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.set_my_avatar_type(text) from public;
grant execute on function public.set_my_avatar_type(text) to authenticated;

notify pgrst, 'reload schema';
