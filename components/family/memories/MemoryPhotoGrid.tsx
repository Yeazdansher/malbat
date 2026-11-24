"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  deleteMemoryPhoto,
  updatePhotoCaption,
  uploadMemoryPhoto,
} from "@/app/family/[id]/memories/actions";
import { useTranslations } from "@/lib/i18n/client";

export type MemoryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
};

type Props = {
  familyId: string;
  albumId: string;
  photos: MemoryPhoto[];
  canEdit: boolean;
};

export default function MemoryPhotoGrid({
  familyId,
  albumId,
  photos,
  canEdit,
}: Props) {
  const t = useTranslations("memories");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const lightboxPhoto = photos.find((photo) => photo.id === lightboxId) ?? null;

  function openLightbox(photo: MemoryPhoto) {
    setLightboxId(photo.id);
    setCaptionDraft(photo.caption ?? "");
    setError("");
  }

  function closeLightbox() {
    setLightboxId(null);
    setError("");
  }

  return (
    <div className="mt-8">
      {canEdit && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;

              const data = new FormData();
              data.set("photo", file);

              setError("");
              startTransition(async () => {
                try {
                  await uploadMemoryPhoto(familyId, albumId, data);
                  router.refresh();
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : t("uploadFailed")
                  );
                }
              });
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a] disabled:opacity-60"
          >
            {pending ? t("uploading") : t("uploadPhoto")}
          </button>
          <p className="text-sm text-[var(--muted-text)]">{t("uploadHint")}</p>
        </div>
      )}

      {error && !lightboxPhoto && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-[var(--muted-text)]">
          {t("emptyPhotos")}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => openLightbox(photo)}
                className="group block w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--page-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                aria-label={photo.caption || t("enlargePhoto")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || ""}
                  className="aspect-square w-full object-cover transition group-hover:brightness-95"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("enlargePhoto")}
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
            aria-label={t("closePhoto")}
          >
            ×
          </button>

          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || ""}
              className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
            />

            {canEdit ? (
              <div className="mx-auto flex w-full max-w-xl flex-col gap-3 rounded-xl bg-black/40 p-4 text-white">
                <label htmlFor="photo-caption" className="text-sm">
                  {t("caption")}
                </label>
                <input
                  id="photo-caption"
                  value={captionDraft}
                  onChange={(event) => setCaptionDraft(event.target.value)}
                  maxLength={200}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/60 focus:outline-none"
                  placeholder={t("captionPlaceholder")}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setError("");
                      startTransition(async () => {
                        try {
                          await updatePhotoCaption(
                            familyId,
                            lightboxPhoto.id,
                            captionDraft
                          );
                          router.refresh();
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : t("saveFailed")
                          );
                        }
                      });
                    }}
                    className="rounded-lg bg-[#1f7a45] px-4 py-2 text-sm font-semibold hover:bg-[#19653a] disabled:opacity-60"
                  >
                    {pending ? t("saving") : t("saveCaption")}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(t("confirmDeletePhoto"))) {
                        return;
                      }
                      setError("");
                      startTransition(async () => {
                        try {
                          await deleteMemoryPhoto(familyId, lightboxPhoto.id);
                          closeLightbox();
                          router.refresh();
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : t("deleteFailed")
                          );
                        }
                      });
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {t("deletePhoto")}
                  </button>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
              </div>
            ) : (
              lightboxPhoto.caption && (
                <p className="text-center text-white/90">
                  {lightboxPhoto.caption}
                </p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
