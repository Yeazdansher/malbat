create table family_members (
    id uuid primary key default gen_random_uuid(),

    family_id uuid not null references families(id) on delete cascade,

    user_id uuid not null references auth.users(id) on delete cascade,

    role text not null check (role in ('owner', 'editor', 'viewer')),

    joined_at timestamptz not null default now(),

    unique (family_id, user_id)
);