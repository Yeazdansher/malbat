create or replace function public.delete_complete_family(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_owner boolean;
begin
  select exists (
    select 1
    from family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role = 'owner'
  ) into v_is_owner;

  if not v_is_owner then
    raise exception 'NOT_OWNER';
  end if;

  delete from relationships
  where family_id = p_family_id;

  delete from persons
  where family_id = p_family_id;

  begin
    delete from family_invitations
    where family_id = p_family_id;
  exception
    when undefined_table then
      null;
  end;

  begin
    delete from invitations
    where family_id = p_family_id;
  exception
    when undefined_table then
      null;
  end;

  begin
    delete from documents
    where family_id = p_family_id;
  exception
    when undefined_table then
      null;
  end;

  delete from family_members
  where family_id = p_family_id;

  delete from families
  where id = p_family_id;
end;
$$;

grant execute on function public.delete_complete_family(uuid) to authenticated;

alter table families enable row level security;

drop policy if exists "owners_can_delete_families" on families;
create policy "owners_can_delete_families"
on families
for delete
using (
  exists (
    select 1
    from family_members
    where family_members.family_id = families.id
      and family_members.user_id = auth.uid()
      and family_members.role = 'owner'
  )
);
