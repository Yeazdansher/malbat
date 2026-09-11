create table if not exists public.plans (
  code text primary key,
  display_name text not null,
  max_owned_families integer check (
    max_owned_families is null or max_owned_families > 0
  ),
  max_persons_per_owned_family integer check (
    max_persons_per_owned_family is null
    or max_persons_per_owned_family > 0
  ),
  created_at timestamptz not null default now()
);

insert into public.plans (
  code,
  display_name,
  max_owned_families,
  max_persons_per_owned_family
)
values
  ('free', 'Free', 1, 50),
  ('premium', 'Premium', null, null)
on conflict (code) do update
set
  display_name = excluded.display_name,
  max_owned_families = excluded.max_owned_families,
  max_persons_per_owned_family =
    excluded.max_persons_per_owned_family;

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null default 'free'
    references public.plans(code),
  status text not null default 'active'
    check (status in ('active', 'payment_required', 'canceled')),
  source text not null default 'default'
    check (source in ('default', 'early_access', 'stripe')),
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.user_plans (user_id, plan_code, status, source)
select id, 'free', 'active', 'default'
from auth.users
on conflict (user_id) do nothing;

alter table public.plans enable row level security;
alter table public.user_plans enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    username
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'username'
  );

  insert into public.user_plans (
    user_id,
    plan_code,
    status,
    source
  )
  values (
    new.id,
    'free',
    'active',
    'default'
  );

  return new;
end;
$$;

create or replace function public.get_my_plan_usage()
returns table (
  plan_code text,
  plan_status text,
  plan_source text,
  owned_families_count bigint,
  owned_persons_count bigint,
  max_owned_families integer,
  max_persons_per_owned_family integer
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

  return query
  with current_plan as (
    select
      coalesce(
        case
          when user_plan.status = 'active' then user_plan.plan_code
        end,
        'free'
      ) as code,
      coalesce(user_plan.status, 'active') as status,
      coalesce(user_plan.source, 'default') as source
    from (select 1) seed
    left join public.user_plans user_plan
      on user_plan.user_id = v_user_id
  ),
  owned_families as (
    select member.family_id
    from public.family_members member
    where member.user_id = v_user_id
      and member.role = 'owner'
  )
  select
    current_plan.code,
    current_plan.status,
    current_plan.source,
    (select count(*) from owned_families),
    coalesce(
      (
        select max(family_usage.person_count)
        from (
          select count(person.id) as person_count
          from owned_families owned
          left join public.persons person
            on person.family_id = owned.family_id
          group by owned.family_id
        ) family_usage
      ),
      0
    ),
    plan.max_owned_families,
    plan.max_persons_per_owned_family
  from current_plan
  join public.plans plan on plan.code = current_plan.code;
end;
$$;

create or replace function public.get_family_plan_usage(
  p_family_id uuid
)
returns table (
  owner_plan_code text,
  current_user_role text,
  person_count bigint,
  max_persons integer,
  can_add_person boolean
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
      plan.max_persons_per_owned_family is null
      or usage.count < plan.max_persons_per_owned_family
    )
  from owner_plan
  join public.plans plan on plan.code = owner_plan.code
  join public.family_members member
    on member.family_id = p_family_id
    and member.user_id = v_user_id
  cross join usage;
end;
$$;

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
end;
$$;

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
  v_owned_count bigint;
  v_max_owned integer;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('family-limit:' || v_user_id::text, 0)
  );

  select plan.max_owned_families
  into v_max_owned
  from public.plans plan
  where plan.code = coalesce(
    (
      select user_plan.plan_code
      from public.user_plans user_plan
      where user_plan.user_id = v_user_id
        and user_plan.status = 'active'
    ),
    'free'
  );

  select count(*)
  into v_owned_count
  from public.family_members
  where user_id = v_user_id
    and role = 'owner';

  if v_max_owned is not null and v_owned_count >= v_max_owned then
    raise exception 'PLAN_OWNED_FAMILY_LIMIT';
  end if;

  insert into public.families (name, description)
  values (trim(p_name), nullif(trim(p_description), ''))
  returning id into v_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (v_family_id, v_user_id, 'owner');

  return v_family_id;
end;
$$;

create or replace function public.enforce_family_person_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_person_count bigint;
  v_max_persons integer;
begin
  select member.user_id
  into v_owner_id
  from public.family_members member
  where member.family_id = new.family_id
    and member.role = 'owner'
  limit 1;

  if v_owner_id is null then
    raise exception 'FAMILY_OWNER_NOT_FOUND';
  end if;

  perform 1
  from public.families
  where id = new.family_id
  for update;

  select plan.max_persons_per_owned_family
  into v_max_persons
  from public.plans plan
  where plan.code = coalesce(
    (
      select user_plan.plan_code
      from public.user_plans user_plan
      where user_plan.user_id = v_owner_id
        and user_plan.status = 'active'
    ),
    'free'
  );

  if v_max_persons is null then
    return new;
  end if;

  select count(*)
  into v_person_count
  from public.persons
  where family_id = new.family_id;

  if v_person_count >= v_max_persons then
    raise exception 'PLAN_PERSON_LIMIT';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_family_person_limit
on public.persons;

create trigger enforce_family_person_limit
before insert on public.persons
for each row
execute function public.enforce_family_person_limit();

create or replace function public.prevent_person_family_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.family_id is distinct from old.family_id then
    raise exception 'PERSON_FAMILY_CHANGE_NOT_ALLOWED';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_person_family_change
on public.persons;

create trigger prevent_person_family_change
before update of family_id on public.persons
for each row
execute function public.prevent_person_family_change();

create or replace function public.create_parents_for_child_atomic(
  p_family_id uuid,
  p_child_id uuid,
  p_father_id uuid,
  p_father_first_name text,
  p_father_last_name text,
  p_mother_id uuid,
  p_mother_first_name text,
  p_mother_last_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_father_id uuid := p_father_id;
  v_mother_id uuid := p_mother_id;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not public.can_edit_family(p_family_id) then
    raise exception 'NOT_EDITOR';
  end if;

  if not exists (
    select 1
    from public.persons
    where id = p_child_id
      and family_id = p_family_id
  ) then
    raise exception 'CHILD_NOT_IN_FAMILY';
  end if;

  perform 1
  from public.families
  where id = p_family_id
  for update;

  if v_father_id is null then
    if nullif(trim(p_father_first_name), '') is null
      or nullif(trim(p_father_last_name), '') is null then
      raise exception 'PARENT_NAME_REQUIRED';
    end if;

    insert into public.persons (
      family_id,
      first_name,
      last_name,
      gender,
      birth_date,
      birth_place,
      is_deceased,
      death_date,
      death_place,
      notes
    )
    values (
      p_family_id,
      trim(p_father_first_name),
      trim(p_father_last_name),
      'male',
      null,
      null,
      false,
      null,
      null,
      null
    )
    returning id into v_father_id;
  elsif not exists (
    select 1
    from public.persons
    where id = v_father_id
      and family_id = p_family_id
      and id <> p_child_id
  ) then
    raise exception 'FATHER_NOT_IN_FAMILY';
  end if;

  if v_mother_id is null then
    if nullif(trim(p_mother_first_name), '') is null
      or nullif(trim(p_mother_last_name), '') is null then
      raise exception 'PARENT_NAME_REQUIRED';
    end if;

    insert into public.persons (
      family_id,
      first_name,
      last_name,
      gender,
      birth_date,
      birth_place,
      is_deceased,
      death_date,
      death_place,
      notes
    )
    values (
      p_family_id,
      trim(p_mother_first_name),
      trim(p_mother_last_name),
      'female',
      null,
      null,
      false,
      null,
      null,
      null
    )
    returning id into v_mother_id;
  elsif not exists (
    select 1
    from public.persons
    where id = v_mother_id
      and family_id = p_family_id
      and id <> p_child_id
  ) then
    raise exception 'MOTHER_NOT_IN_FAMILY';
  end if;

  if v_father_id = v_mother_id then
    raise exception 'PARENTS_MUST_DIFFER';
  end if;

  insert into public.relationships (
    family_id,
    person1_id,
    person2_id,
    relationship_type
  )
  values
    (p_family_id, v_father_id, p_child_id, 'father'),
    (p_family_id, v_mother_id, p_child_id, 'mother');

  if not exists (
    select 1
    from public.relationships
    where family_id = p_family_id
      and relationship_type = 'partner'
      and (
        (
          person1_id = v_father_id
          and person2_id = v_mother_id
        )
        or (
          person1_id = v_mother_id
          and person2_id = v_father_id
        )
      )
  ) then
    insert into public.relationships (
      family_id,
      person1_id,
      person2_id,
      relationship_type
    )
    values (
      p_family_id,
      v_father_id,
      v_mother_id,
      'partner'
    );
  end if;
end;
$$;

revoke all on table public.plans from anon, authenticated;
revoke all on table public.user_plans from anon, authenticated;

revoke all on function public.get_my_plan_usage() from public;
revoke all on function public.get_family_plan_usage(uuid) from public;
revoke all on function public.activate_free_premium() from public;
revoke all on function public.enforce_family_person_limit() from public;
revoke all on function public.prevent_person_family_change() from public;
revoke all on function public.create_parents_for_child_atomic(
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  text
) from public;

grant execute on function public.get_my_plan_usage()
to authenticated;
grant execute on function public.get_family_plan_usage(uuid)
to authenticated;
grant execute on function public.activate_free_premium()
to authenticated;
grant execute on function public.create_parents_for_child_atomic(
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid,
  text,
  text
)
to authenticated;
