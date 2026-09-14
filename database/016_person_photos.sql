-- Person photos: column + storage bucket.
-- Path convention: {familyId}/{personId}.{jpg|png|webp}

alter table public.persons
add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'person-photos',
  'person-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "person_photos_member_read" on storage.objects;
create policy "person_photos_member_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'person-photos'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

-- Public read also needed for next/image / <img> without auth headers on public URLs.
drop policy if exists "person_photos_public_read" on storage.objects;
create policy "person_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'person-photos');

drop policy if exists "person_photos_editor_insert" on storage.objects;
create policy "person_photos_editor_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'person-photos'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "person_photos_editor_update" on storage.objects;
create policy "person_photos_editor_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'person-photos'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'person-photos'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "person_photos_editor_delete" on storage.objects;
create policy "person_photos_editor_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'person-photos'
  and public.can_edit_family(((storage.foldername(name))[1])::uuid)
);
