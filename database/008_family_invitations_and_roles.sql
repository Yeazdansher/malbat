create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  token_hash text not null unique,
  role text not null check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  constraint family_invitation_token_hash_format
    check (token_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists family_invitations_family_id_idx
on public.family_invitations(family_id);

alter table public.family_invitations enable row level security;

create or replace function public.is_family_member(p_family_id uuid)
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
  );
$$;

create or replace function public.can_edit_family(p_family_id uuid)
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

create or replace function public.is_family_owner(p_family_id uuid)
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
      and role = 'owner'
  );
$$;

revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.can_edit_family(uuid) from public;
revoke all on function public.is_family_owner(uuid) from public;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.can_edit_family(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;

create or replace function public.create_family_with_owner(
  p_name text,
  p_description text
)
returns uuid
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

  if nullif(trim(p_name), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  insert into public.families (name, description)
  values (trim(p_name), nullif(trim(p_description), ''))
  returning id into v_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (v_family_id, v_user_id, 'owner');

  return v_family_id;
end;
$$;

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
  if not public.is_family_owner(p_family_id) then
    raise exception 'NOT_OWNER';
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

create or replace function public.get_family_invitation(
  p_token_hash text
)
returns table (
  family_id uuid,
  family_name text,
  invitation_role text,
  expires_at timestamptz,
  invitation_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invitation.family_id,
    family.name,
    invitation.role,
    invitation.expires_at,
    case
      when invitation.accepted_at is not null then 'accepted'
      when invitation.expires_at <= now() then 'expired'
      else 'valid'
    end
  from public.family_invitations invitation
  join public.families family on family.id = invitation.family_id
  where invitation.token_hash = p_token_hash
  limit 1;
$$;

create or replace function public.accept_family_invitation(
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.family_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select *
  into v_invitation
  from public.family_invitations
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  if v_invitation.accepted_at is not null then
    raise exception 'INVITATION_ALREADY_USED';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception 'INVITATION_EXPIRED';
  end if;

  insert into public.family_members (
    family_id,
    user_id,
    role
  )
  values (
    v_invitation.family_id,
    v_user_id,
    v_invitation.role
  )
  on conflict (family_id, user_id) do nothing;

  update public.family_invitations
  set
    accepted_at = now(),
    accepted_by = v_user_id
  where id = v_invitation.id;

  return v_invitation.family_id;
end;
$$;

create or replace function public.list_family_members(
  p_family_id uuid
)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  username text,
  member_role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_family_owner(p_family_id) then
    raise exception 'NOT_OWNER';
  end if;

  return query
  select
    member.user_id,
    profile.first_name,
    profile.last_name,
    profile.username,
    member.role,
    member.joined_at
  from public.family_members member
  join public.profiles profile on profile.id = member.user_id
  where member.family_id = p_family_id
  order by
    case when member.role = 'owner' then 0 else 1 end,
    lower(profile.last_name),
    lower(profile.first_name);
end;
$$;

create or replace function public.update_family_member_role(
  p_family_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_family_owner(p_family_id) then
    raise exception 'NOT_OWNER';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'INVALID_ROLE';
  end if;

  update public.family_members
  set role = p_role
  where family_id = p_family_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    raise exception 'MEMBER_NOT_FOUND_OR_OWNER';
  end if;
end;
$$;

create or replace function public.remove_family_member(
  p_family_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_family_owner(p_family_id) then
    raise exception 'NOT_OWNER';
  end if;

  delete from public.family_members
  where family_id = p_family_id
    and user_id = p_user_id
    and role <> 'owner';

  if not found then
    raise exception 'MEMBER_NOT_FOUND_OR_OWNER';
  end if;
end;
$$;

revoke all on function public.create_family_invitation(uuid, text, text)
from public;
revoke all on function public.create_family_with_owner(text, text)
from public;
revoke all on function public.get_family_invitation(text) from public;
revoke all on function public.accept_family_invitation(text) from public;
revoke all on function public.list_family_members(uuid) from public;
revoke all on function public.update_family_member_role(uuid, uuid, text)
from public;
revoke all on function public.remove_family_member(uuid, uuid) from public;

grant execute on function public.create_family_invitation(uuid, text, text)
to authenticated;
grant execute on function public.create_family_with_owner(text, text)
to authenticated;
grant execute on function public.get_family_invitation(text)
to anon, authenticated;
grant execute on function public.accept_family_invitation(text)
to authenticated;
grant execute on function public.list_family_members(uuid)
to authenticated;
grant execute on function public.update_family_member_role(uuid, uuid, text)
to authenticated;
grant execute on function public.remove_family_member(uuid, uuid)
to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.persons enable row level security;
alter table public.relationships enable row level security;

drop policy if exists "family_members_can_read_families"
on public.families;
create policy "family_members_can_read_families"
on public.families
for select
to authenticated
using (public.is_family_member(id));

drop policy if exists "users_can_read_own_family_memberships"
on public.family_members;
create policy "users_can_read_own_family_memberships"
on public.family_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_family_owner(family_id)
);

drop policy if exists "family_members_can_read_persons" on public.persons;
create policy "family_members_can_read_persons"
on public.persons
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "family_editors_can_insert_persons" on public.persons;
create policy "family_editors_can_insert_persons"
on public.persons
for insert
to authenticated
with check (public.can_edit_family(family_id));

drop policy if exists "family_editors_can_update_persons" on public.persons;
create policy "family_editors_can_update_persons"
on public.persons
for update
to authenticated
using (public.can_edit_family(family_id))
with check (public.can_edit_family(family_id));

drop policy if exists "family_editors_can_delete_persons" on public.persons;
create policy "family_editors_can_delete_persons"
on public.persons
for delete
to authenticated
using (public.can_edit_family(family_id));

drop policy if exists "family_members_can_read_relationships"
on public.relationships;
create policy "family_members_can_read_relationships"
on public.relationships
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "family_editors_can_insert_relationships"
on public.relationships;
create policy "family_editors_can_insert_relationships"
on public.relationships
for insert
to authenticated
with check (public.can_edit_family(family_id));

drop policy if exists "family_editors_can_update_relationships"
on public.relationships;
create policy "family_editors_can_update_relationships"
on public.relationships
for update
to authenticated
using (public.can_edit_family(family_id))
with check (public.can_edit_family(family_id));

drop policy if exists "family_editors_can_delete_relationships"
on public.relationships;
create policy "family_editors_can_delete_relationships"
on public.relationships
for delete
to authenticated
using (public.can_edit_family(family_id));
