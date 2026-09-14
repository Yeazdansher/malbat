export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export function isAllowedImageType(
  value: string
): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}

export function extensionForImageType(type: AllowedImageType): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function validateImageFile(
  file: File | null
): { ok: true; file: File; type: AllowedImageType } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Bitte wähle ein Bild aus." };
  }

  if (!isAllowedImageType(file.type)) {
    return {
      ok: false,
      error: "Nur JPEG, PNG oder WebP sind erlaubt.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Das Bild darf höchstens 2 MB groß sein.",
    };
  }

  return { ok: true, file, type: file.type };
}
