-- リモートで古い ensure_my_profile（explorer を自動挿入）が残っている場合の再適用。
-- アプリは /api/profile で RPC に依存せず null 挿入するが、DB 単体の整合用。

create or replace function public.ensure_my_profile()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  av text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.user_profiles (user_id, avatar_type)
  values (uid, null)
  on conflict (user_id) do nothing;

  select avatar_type into av from public.user_profiles where user_id = uid;
  return av;
end;
$$;

revoke all on function public.ensure_my_profile() from public;
grant execute on function public.ensure_my_profile() to authenticated;

notify pgrst, 'reload schema';
