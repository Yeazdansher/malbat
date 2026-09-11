create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    first_name text not null,

    last_name text not null,

    username text not null unique,

    avatar_url text,

    created_at timestamptz not null default now()
);