create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  for v_family_id in
    select family_id
    from public.family_members
    where user_id = v_user_id
      and role = 'owner'
  loop
    perform public.delete_complete_family(v_family_id);
  end loop;

  delete from auth.users
  where id = v_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
