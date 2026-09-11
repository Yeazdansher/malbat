alter table public.families enable row level security;

drop policy if exists "owners_can_update_families"
on public.families;

create policy "owners_can_update_families"
on public.families
for update
to authenticated
using (
  exists (
    select 1
    from public.family_members
    where family_members.family_id = families.id
      and family_members.user_id = auth.uid()
      and family_members.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.family_members
    where family_members.family_id = families.id
      and family_members.user_id = auth.uid()
      and family_members.role = 'owner'
  )
);
