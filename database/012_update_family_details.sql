-- Sicheres Aktualisieren von Stammbaum-Name/Beschreibung durch den Besitzer.
-- Bitte im Supabase SQL Editor ausführen.

create or replace function public.update_family_details(
  p_family_id uuid,
  p_name text,
  p_description text
)
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

  if not public.is_family_owner(p_family_id) then
    raise exception 'NOT_OWNER';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  if char_length(trim(p_name)) > 100 then
    raise exception 'NAME_TOO_LONG';
  end if;

  if char_length(coalesce(p_description, '')) > 1000 then
    raise exception 'DESCRIPTION_TOO_LONG';
  end if;

  update public.families
  set
    name = trim(p_name),
    description = nullif(trim(p_description), '')
  where id = p_family_id;

  if not found then
    raise exception 'FAMILY_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.update_family_details(uuid, text, text)
from public;
grant execute on function public.update_family_details(uuid, text, text)
to authenticated;

-- Fallback-Policy, falls 007 noch nicht angewendet wurde
alter table public.families enable row level security;

drop policy if exists "owners_can_update_families"
on public.families;

create policy "owners_can_update_families"
on public.families
for update
to authenticated
using (public.is_family_owner(id))
with check (public.is_family_owner(id));
