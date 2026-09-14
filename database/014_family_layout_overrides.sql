-- Manuelle Kartenpositionen pro Stammbaum (Anordnen-Modus).
-- Nur Darstellung — Beziehungen bleiben unverändert.

create table if not exists public.family_layout_overrides (
  family_id uuid not null references public.families(id) on delete cascade,
  node_id text not null,
  pos_x double precision not null,
  pos_y double precision not null,
  updated_at timestamptz not null default now(),
  primary key (family_id, node_id)
);

create index if not exists family_layout_overrides_family_id_idx
on public.family_layout_overrides(family_id);

alter table public.family_layout_overrides enable row level security;

drop policy if exists "family_members_can_read_layout_overrides"
on public.family_layout_overrides;
create policy "family_members_can_read_layout_overrides"
on public.family_layout_overrides
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "family_editors_can_write_layout_overrides"
on public.family_layout_overrides;
create policy "family_editors_can_write_layout_overrides"
on public.family_layout_overrides
for all
to authenticated
using (public.can_edit_family(family_id))
with check (public.can_edit_family(family_id));
