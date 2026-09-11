-- Downgrade auf Free inkl. Sperrung überschüssiger eigener Stammbäume.
-- Bitte im Supabase SQL Editor ausführen.

alter table public.families
add column if not exists plan_locked boolean not null default false;

create or replace function public.activate_free_premium()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.user_plans (
    user_id,
    plan_code,
    status,
    source,
    activated_at,
    updated_at
  )
  values (
    v_user_id,
    'premium',
    'active',
    'early_access',
    now(),
    now()
  )
  on conflict (user_id) do update
  set
    plan_code = 'premium',
    status = 'active',
    source = 'early_access',
    activated_at = now(),
    updated_at = now();

  update public.families family
  set plan_locked = false
  where family.id in (
    select member.family_id
    from public.family_members member
    where member.user_id = v_user_id
      and member.role = 'owner'
  );
end;
$$;

create or replace function public.downgrade_to_free()
returns table (
  kept_family_id uuid,
  locked_family_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_kept_family_id uuid;
  v_max_persons integer;
  v_locked_count bigint;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select plan.max_persons_per_owned_family
  into v_max_persons
  from public.plans plan
  where plan.code = 'free';

  insert into public.user_plans (
    user_id,
    plan_code,
    status,
    source,
    activated_at,
    updated_at
  )
  values (
    v_user_id,
    'free',
    'active',
    'default',
    now(),
    now()
  )
  on conflict (user_id) do update
  set
    plan_code = 'free',
    status = 'active',
    source = 'default',
    activated_at = now(),
    updated_at = now();

  select owned.family_id
  into v_kept_family_id
  from (
    select
      member.family_id,
      family.created_at,
      (
        select count(*)
        from public.persons person
        where person.family_id = member.family_id
      ) as person_count
    from public.family_members member
    join public.families family on family.id = member.family_id
    where member.user_id = v_user_id
      and member.role = 'owner'
  ) owned
  where v_max_persons is null
    or owned.person_count <= v_max_persons
  order by owned.created_at asc
  limit 1;

  update public.families family
  set plan_locked = true
  where family.id in (
    select member.family_id
    from public.family_members member
    where member.user_id = v_user_id
      and member.role = 'owner'
  )
  and (
    v_kept_family_id is null
    or family.id <> v_kept_family_id
  );

  if v_kept_family_id is not null then
    update public.families
    set plan_locked = false
    where id = v_kept_family_id;
  end if;

  select count(*)
  into v_locked_count
  from public.family_members member
  join public.families family on family.id = member.family_id
  where member.user_id = v_user_id
    and member.role = 'owner'
    and family.plan_locked = true;

  return query
  select v_kept_family_id, v_locked_count;
end;
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
    from public.family_members member
    join public.families family on family.id = member.family_id
    where member.family_id = p_family_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'editor')
      and family.plan_locked = false
  );
$$;

drop function if exists public.get_family_plan_usage(uuid);

create or replace function public.get_family_plan_usage(
  p_family_id uuid
)
returns table (
  owner_plan_code text,
  current_user_role text,
  person_count bigint,
  max_persons integer,
  can_add_person boolean,
  plan_locked boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not public.is_family_member(p_family_id) then
    raise exception 'NOT_MEMBER';
  end if;

  return query
  with family_owner as (
    select member.user_id
    from public.family_members member
    where member.family_id = p_family_id
      and member.role = 'owner'
    limit 1
  ),
  owner_plan as (
    select
      coalesce(
        case
          when user_plan.status = 'active' then user_plan.plan_code
        end,
        'free'
      ) as code
    from family_owner owner
    left join public.user_plans user_plan
      on user_plan.user_id = owner.user_id
  ),
  usage as (
    select count(*) as count
    from public.persons
    where family_id = p_family_id
  )
  select
    owner_plan.code,
    member.role,
    usage.count,
    plan.max_persons_per_owned_family,
    (
      family.plan_locked = false
      and (
        plan.max_persons_per_owned_family is null
        or usage.count < plan.max_persons_per_owned_family
      )
    ),
    family.plan_locked
  from owner_plan
  join public.plans plan on plan.code = owner_plan.code
  join public.family_members member
    on member.family_id = p_family_id
    and member.user_id = v_user_id
  join public.families family on family.id = p_family_id
  cross join usage;
end;
$$;

revoke all on function public.downgrade_to_free() from public;
grant execute on function public.downgrade_to_free() to authenticated;
grant execute on function public.activate_free_premium() to authenticated;
grant execute on function public.can_edit_family(uuid) to authenticated;
grant execute on function public.get_family_plan_usage(uuid) to authenticated;
