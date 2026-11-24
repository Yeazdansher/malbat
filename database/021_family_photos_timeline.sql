-- Flatten memory albums → family photo timeline (taken_at).
-- Run after 020 if the album-based schema was already applied.

alter table public.family_memory_photos
  add column if not exists taken_at date;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'family_memory_albums'
  ) then
    update public.family_memory_photos as photo
    set taken_at = album.event_date
    from public.family_memory_albums as album
    where photo.album_id = album.id
      and photo.taken_at is null
      and album.event_date is not null;

    alter table public.family_memory_photos
      drop constraint if exists family_memory_photos_album_id_fkey;

    alter table public.family_memory_photos
      drop column if exists album_id;

    drop table if exists public.family_memory_albums cascade;
  end if;
end $$;

alter table public.family_memory_photos
  drop column if exists sort_order;

create index if not exists family_memory_photos_taken_at_idx
on public.family_memory_photos(family_id, taken_at desc nulls last);
