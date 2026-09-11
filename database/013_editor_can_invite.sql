-- Bearbeiter dürfen Einladungslinks erstellen (wie Besitzer).
-- Rollen in Einladungen bleiben weiterhin nur editor/viewer.

create or replace function public.is_family_owner_or_editor(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

revoke all on function public.is_family_owner_or_editor(uuid) from public;
grant execute on function public.is_family_owner_or_editor(uuid) to authenticated;

create or replace function public.create_family_invitation(
  p_family_id uuid,
  p_token_hash text,
  p_role text
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires_at timestamptz := now() + interval '7 days';
begin
  if not public.is_family_owner_or_editor(p_family_id) then
    raise exception 'NOT_ALLOWED';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'INVALID_ROLE';
  end if;

  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_TOKEN';
  end if;

  delete from public.family_invitations
  where family_id = p_family_id
    and expires_at <= now();

  insert into public.family_invitations (
    family_id,
    token_hash,
    role,
    created_by,
    expires_at
  )
  values (
    p_family_id,
    p_token_hash,
    p_role,
    auth.uid(),
    v_expires_at
  );

  return v_expires_at;
end;
$$;
