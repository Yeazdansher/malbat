"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireFamilyEditor } from "@/lib/family-permissions";
import {
  extensionForImageType,
  MAX_FAMILY_PHOTO_BYTES,
  validateImageFile,
} from "@/lib/storage/images";

const MEMORIES_BUCKET = "family-memories";

function photosPath(familyId: string) {
  return `/family/${familyId}/memories`;
}

function parseTakenAt(raw: string): string | null {
  const takenAt = raw.trim();
  if (!takenAt) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(takenAt)) {
    throw new Error("Ungültiges Datum.");
  }

  const date = new Date(`${takenAt}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Ungültiges Datum.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    throw new Error("Das Datum darf nicht in der Zukunft liegen.");
  }

  return takenAt;
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

const MAX_PHOTOS_PER_UPLOAD = 20;

export async function uploadFamilyPhotos(familyId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    throw new Error("Bitte wähle mindestens ein Bild aus.");
  }

  if (files.length > MAX_PHOTOS_PER_UPLOAD) {
    throw new Error(
      `Es können höchstens ${MAX_PHOTOS_PER_UPLOAD} Fotos auf einmal hochgeladen werden.`
    );
  }

  const caption = String(formData.get("caption") ?? "").trim();
  const takenAt = parseTakenAt(String(formData.get("taken_at") ?? ""));

  let uploaded = 0;
  const failures: string[] = [];

  for (const file of files) {
    const validated = validateImageFile(file, MAX_FAMILY_PHOTO_BYTES);
    if (!validated.ok) {
      failures.push(`${file.name}: ${validated.error}`);
      continue;
    }

    const { file: image, type } = validated;
    const photoId = crypto.randomUUID();
    const ext = extensionForImageType(type);
    const storagePath = `${familyId}/${photoId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(MEMORIES_BUCKET)
      .upload(storagePath, image, {
        upsert: false,
        contentType: type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("uploadFamilyPhotos (upload):", uploadError);
      failures.push(`${file.name}: Upload fehlgeschlagen.`);
      continue;
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
        taken_at: takenAt,
        uploaded_by: user.id,
      });

    if (insertError) {
      console.error("uploadFamilyPhotos (insert):", insertError);
      await removeStoragePaths(supabase, [storagePath]);
      failures.push(
        `${file.name}: ${insertError.message?.trim() || "Speichern fehlgeschlagen."}`
      );
      continue;
    }

    uploaded += 1;
  }

  if (uploaded > 0) {
    revalidatePath(photosPath(familyId));
    revalidatePath(`/family/${familyId}`);
  }

  if (uploaded === 0) {
    throw new Error(
      failures[0] ||
        "Die Fotos konnten nicht hochgeladen werden. Bitte versuche es erneut."
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `${uploaded} Foto(s) hochgeladen, ${failures.length} fehlgeschlagen. ${failures[0]}`
    );
  }
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
  const takenAt = parseTakenAt(String(formData.get("taken_at") ?? ""));

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
      taken_at: takenAt,
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
