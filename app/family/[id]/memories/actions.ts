"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireFamilyEditor } from "@/lib/family-permissions";
import {
  extensionForImageType,
  validateImageFile,
} from "@/lib/storage/images";

const MEMORIES_BUCKET = "family-memories";

function memoriesPath(familyId: string, albumId?: string) {
  return albumId ? `/family/${familyId}/memories/${albumId}` : `/family/${familyId}/memories`;
}

async function requireAlbumInFamily(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  albumId: string
) {
  const { data, error } = await supabase
    .from("family_memory_albums")
    .select("id")
    .eq("id", albumId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Album nicht gefunden.");
  }
}

async function removeStoragePaths(
  client: Awaited<ReturnType<typeof createClient>>,
  paths: string[]
) {
  if (paths.length === 0) {
    return;
  }

  const { error } = await client.storage.from(MEMORIES_BUCKET).remove(paths);
  if (error) {
    console.error("family-memories remove:", error);
  }
}

async function listAlbumStoragePaths(
  client: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  albumId: string
) {
  const folder = `${familyId}/${albumId}`;
  const { data, error } = await client.storage.from(MEMORIES_BUCKET).list(folder);

  if (error || !data) {
    return [] as string[];
  }

  return data
    .filter((entry) => entry.id !== null)
    .map((entry) => `${folder}/${entry.name}`);
}

export async function createAlbum(familyId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();

  if (!title) {
    throw new Error("Bitte einen Titel angeben.");
  }

  const { data, error } = await supabase
    .from("family_memory_albums")
    .insert({
      family_id: familyId,
      title,
      description: description || null,
      event_date: eventDate || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createAlbum:", error);
    throw new Error("Album konnte nicht erstellt werden.");
  }

  revalidatePath(memoriesPath(familyId));
  return { id: data.id as string };
}

export async function updateAlbum(
  familyId: string,
  albumId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requireAlbumInFamily(supabase, familyId, albumId);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();

  if (!title) {
    throw new Error("Bitte einen Titel angeben.");
  }

  const { error } = await supabase
    .from("family_memory_albums")
    .update({
      title,
      description: description || null,
      event_date: eventDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", albumId)
    .eq("family_id", familyId);

  if (error) {
    console.error("updateAlbum:", error);
    throw new Error("Album konnte nicht gespeichert werden.");
  }

  revalidatePath(memoriesPath(familyId));
  revalidatePath(memoriesPath(familyId, albumId));
}

export async function deleteAlbum(familyId: string, albumId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requireAlbumInFamily(supabase, familyId, albumId);

  const paths = await listAlbumStoragePaths(supabase, familyId, albumId);
  await removeStoragePaths(supabase, paths);

  const { error } = await supabase
    .from("family_memory_albums")
    .delete()
    .eq("id", albumId)
    .eq("family_id", familyId);

  if (error) {
    console.error("deleteAlbum:", error);
    throw new Error("Album konnte nicht gelöscht werden.");
  }

  revalidatePath(memoriesPath(familyId));
  revalidatePath(memoriesPath(familyId, albumId));
}

export async function uploadMemoryPhoto(
  familyId: string,
  albumId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requireAlbumInFamily(supabase, familyId, albumId);

  const validated = validateImageFile(
    formData.get("photo") instanceof File
      ? (formData.get("photo") as File)
      : null
  );

  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const { file, type } = validated;
  const caption = String(formData.get("caption") ?? "").trim();

  const { data: maxSort } = await supabase
    .from("family_memory_photos")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort =
    typeof maxSort?.sort_order === "number" ? maxSort.sort_order + 1 : 0;

  const photoId = crypto.randomUUID();
  const ext = extensionForImageType(type);
  const storagePath = `${familyId}/${albumId}/${photoId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEMORIES_BUCKET)
    .upload(storagePath, file, {
      upsert: false,
      contentType: type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("uploadMemoryPhoto (upload):", uploadError);
    throw new Error(
      "Das Foto konnte nicht hochgeladen werden. Bitte versuche es erneut."
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(storagePath);

  const { error: insertError } = await supabase
    .from("family_memory_photos")
    .insert({
      id: photoId,
      album_id: albumId,
      family_id: familyId,
      storage_path: storagePath,
      url: `${publicUrl}?v=${Date.now()}`,
      caption: caption || null,
      sort_order: nextSort,
      uploaded_by: user.id,
    });

  if (insertError) {
    console.error("uploadMemoryPhoto (insert):", insertError);
    await removeStoragePaths(supabase, [storagePath]);
    throw new Error(
      "Das Foto wurde hochgeladen, konnte aber nicht gespeichert werden."
    );
  }

  revalidatePath(memoriesPath(familyId));
  revalidatePath(memoriesPath(familyId, albumId));
}

export async function updatePhotoCaption(
  familyId: string,
  photoId: string,
  caption: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);

  const trimmed = caption.trim();

  const { data: photo, error: findError } = await supabase
    .from("family_memory_photos")
    .select("id, album_id")
    .eq("id", photoId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (findError || !photo) {
    throw new Error("Foto nicht gefunden.");
  }

  const { error } = await supabase
    .from("family_memory_photos")
    .update({ caption: trimmed || null })
    .eq("id", photoId)
    .eq("family_id", familyId);

  if (error) {
    console.error("updatePhotoCaption:", error);
    throw new Error("Beschriftung konnte nicht gespeichert werden.");
  }

  revalidatePath(memoriesPath(familyId, photo.album_id));
}

export async function deleteMemoryPhoto(familyId: string, photoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);

  const { data: photo, error: findError } = await supabase
    .from("family_memory_photos")
    .select("id, album_id, storage_path")
    .eq("id", photoId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (findError || !photo) {
    throw new Error("Foto nicht gefunden.");
  }

  if (photo.storage_path) {
    await removeStoragePaths(supabase, [photo.storage_path]);
  }

  const { error } = await supabase
    .from("family_memory_photos")
    .delete()
    .eq("id", photoId)
    .eq("family_id", familyId);

  if (error) {
    console.error("deleteMemoryPhoto:", error);
    throw new Error("Foto konnte nicht gelöscht werden.");
  }

  revalidatePath(memoriesPath(familyId));
  revalidatePath(memoriesPath(familyId, photo.album_id));
}
