"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireFamilyEditor } from "@/lib/family-permissions";
import {
  extensionForImageType,
  validateImageFile,
} from "@/lib/storage/images";

const MEMORIES_BUCKET = "family-memories";

function photosPath(familyId: string) {
  return `/family/${familyId}/memories`;
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

export async function uploadFamilyPhoto(familyId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);

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
  const takenAt = String(formData.get("taken_at") ?? "").trim();

  const photoId = crypto.randomUUID();
  const ext = extensionForImageType(type);
  const storagePath = `${familyId}/${photoId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEMORIES_BUCKET)
    .upload(storagePath, file, {
      upsert: false,
      contentType: type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("uploadFamilyPhoto (upload):", uploadError);
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
      family_id: familyId,
      storage_path: storagePath,
      url: `${publicUrl}?v=${Date.now()}`,
      caption: caption || null,
      taken_at: takenAt || null,
      uploaded_by: user.id,
    });

  if (insertError) {
    console.error("uploadFamilyPhoto (insert):", insertError);
    await removeStoragePaths(supabase, [storagePath]);
    throw new Error(
      "Das Foto wurde hochgeladen, konnte aber nicht gespeichert werden."
    );
  }

  revalidatePath(photosPath(familyId));
}

export async function updateFamilyPhoto(
  familyId: string,
  photoId: string,
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

  const caption = String(formData.get("caption") ?? "").trim();
  const takenAt = String(formData.get("taken_at") ?? "").trim();

  const { data: photo, error: findError } = await supabase
    .from("family_memory_photos")
    .select("id")
    .eq("id", photoId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (findError || !photo) {
    throw new Error("Foto nicht gefunden.");
  }

  const { error } = await supabase
    .from("family_memory_photos")
    .update({
      caption: caption || null,
      taken_at: takenAt || null,
    })
    .eq("id", photoId)
    .eq("family_id", familyId);

  if (error) {
    console.error("updateFamilyPhoto:", error);
    throw new Error("Foto konnte nicht gespeichert werden.");
  }

  revalidatePath(photosPath(familyId));
}

export async function deleteFamilyPhoto(familyId: string, photoId: string) {
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
    .select("id, storage_path")
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
    console.error("deleteFamilyPhoto:", error);
    throw new Error("Foto konnte nicht gelöscht werden.");
  }

  revalidatePath(photosPath(familyId));
}
