create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  gender text not null check (gender in ('male', 'female', 'unknown')),
  birth_date date,
  birth_place text,
  is_deceased boolean not null default false,
  death_date date,
  death_place text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists persons_family_id_idx
on public.persons(family_id);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person1_id uuid not null references public.persons(id) on delete cascade,
  person2_id uuid not null references public.persons(id) on delete cascade,
  relationship_type text not null check (
    relationship_type in (
      'partner',
      'parent',
      'adoptive-parent',
      'father',
      'mother',
      'sibling'
    )
  ),
  created_at timestamptz not null default now(),
  check (person1_id <> person2_id)
);

create index if not exists relationships_family_id_idx
on public.relationships(family_id);

create index if not exists relationships_person1_id_idx
on public.relationships(person1_id);

create index if not exists relationships_person2_id_idx
on public.relationships(person2_id);
