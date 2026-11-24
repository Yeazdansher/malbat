export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_FAMILY_PHOTO_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export type ImageValidationCode = "empty" | "type" | "size";

function sizeErrorMessage(maxBytes: number): string {
  const mb = Math.round(maxBytes / (1024 * 1024));
  return `Das Bild darf höchstens ${mb} MB groß sein.`;
}

const IMAGE_ERROR_DE: Record<Exclude<ImageValidationCode, "size">, string> = {
  empty: "Bitte wähle ein Bild aus.",
  type: "Nur JPEG, PNG oder WebP sind erlaubt.",
};

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
  file: File | null,
  maxBytes: number = MAX_IMAGE_BYTES
):
  | { ok: true; file: File; type: AllowedImageType }
  | { ok: false; code: ImageValidationCode; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, code: "empty", error: IMAGE_ERROR_DE.empty };
  }

  if (!isAllowedImageType(file.type)) {
    return { ok: false, code: "type", error: IMAGE_ERROR_DE.type };
  }

  if (file.size > maxBytes) {
    return { ok: false, code: "size", error: sizeErrorMessage(maxBytes) };
  }

  return { ok: true, file, type: file.type };
}
