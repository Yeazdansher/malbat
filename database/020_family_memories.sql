-- Family memory photos (timeline, no albums). Separate from person-photos.
-- Storage path: {familyId}/{photoId}.{jpg|png|webp}

create table if not exists public.family_memory_photos (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  storage_path text not null,
  url text not null,
  caption text,
  taken_at date,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists family_memory_photos_family_id_idx
on public.family_memory_photos(family_id);

create index if not exists family_memory_photos_taken_at_idx
on public.family_memory_photos(family_id, taken_at desc nulls last);

alter table public.family_memory_photos enable row level security;

drop policy if exists "family_members_can_read_memory_photos"
on public.family_memory_photos;
create policy "family_members_can_read_memory_photos"
on public.family_memory_photos
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "family_editors_can_insert_memory_photos"
on public.family_memory_photos;
create policy "family_editors_can_insert_memory_photos"
on public.family_memory_photos
for insert
to authenticated
with check (public.can_edit_family(family_id));

drop policy if exists "family_editors_can_update_memory_photos"
on public.family_memory_photos;
create policy "family_editors_can_update_memory_photos"
on public.family_memory_photos
for update
to authenticated
using (public.can_edit_family(family_id))
with check (public.can_edit_family(family_id));

drop policy if exists "family_editors_can_delete_memory_photos"
on public.family_memory_photos;
create policy "family_editors_can_delete_memory_photos"
on public.family_memory_photos
for delete
to authenticated
using (public.can_edit_family(family_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-memories',
  'family-memories',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "family_memories_member_read" on storage.objects;
create policy "family_memories_member_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'family-memories'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "family_memories_public_read" on storage.objects;
create policy "family_memories_public_read"
on storage.objects
for select
to public
using (bucket_id = 'family-memories');

drop policy if exists "family_memories_editor_insert" on storage.objects;
create policy "family_memories_editor_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'family-memories'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "family_memories_editor_update" on storage.objects;
create policy "family_memories_editor_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'family-memories'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'family-memories'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "family_memories_editor_delete" on storage.objects;
create policy "family_memories_editor_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'family-memories'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
);
