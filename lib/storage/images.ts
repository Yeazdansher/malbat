export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export type ImageValidationCode = "empty" | "type" | "size";

const IMAGE_ERROR_DE: Record<ImageValidationCode, string> = {
  empty: "Bitte wähle ein Bild aus.",
  type: "Nur JPEG, PNG oder WebP sind erlaubt.",
  size: "Das Bild darf höchstens 2 MB groß sein.",
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
  file: File | null
):
  | { ok: true; file: File; type: AllowedImageType }
  | { ok: false; code: ImageValidationCode; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, code: "empty", error: IMAGE_ERROR_DE.empty };
  }

  if (!isAllowedImageType(file.type)) {
    return { ok: false, code: "type", error: IMAGE_ERROR_DE.type };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, code: "size", error: IMAGE_ERROR_DE.size };
  }

  return { ok: true, file, type: file.type };
}
