"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteFamilyPhoto,
  updateFamilyPhoto,
} from "@/app/family/[id]/memories/actions";
import { useTranslations } from "@/lib/i18n/client";

export type FamilyPhoto = {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
};

type Props = {
  familyId: string;
  photos: FamilyPhoto[];
  canEdit: boolean;
  locale: string;
  emptyMessage: string;
};

type TimelineGroup = {
  key: string;
  label: string;
  photos: FamilyPhoto[];
};

function formatTakenAt(value: string | null, locale: string, unknownLabel: string) {
  if (!value) return unknownLabel;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function groupPhotosByDate(
  photos: FamilyPhoto[],
  locale: string,
  unknownLabel: string
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const photo of photos) {
    const key = photo.taken_at ?? "unknown";
    const existing = groups.get(key);
    if (existing) {
      existing.photos.push(photo);
      continue;
    }

    groups.set(key, {
      key,
      label: formatTakenAt(photo.taken_at, locale, unknownLabel),
      photos: [photo],
    });
  }

  return Array.from(groups.values());
}

export default function FamilyPhotoTimeline({
  familyId,
  photos,
  canEdit,
  locale,
  emptyMessage,
}: Props) {
  const t = useTranslations("memories");
  const router = useRouter();
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [takenAtDraft, setTakenAtDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const lightboxPhoto = photos.find((photo) => photo.id === lightboxId) ?? null;
  const groups = groupPhotosByDate(photos, locale, t("unknownDate"));

  function openLightbox(photo: FamilyPhoto) {
    setLightboxId(photo.id);
    setCaptionDraft(photo.caption ?? "");
    setTakenAtDraft(photo.taken_at ?? "");
    setError("");
  }

  function closeLightbox() {
    setLightboxId(null);
    setError("");
  }

  if (photos.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-[var(--muted-text)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-10">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="mb-4 text-lg font-semibold text-[var(--card-text)]">
            {group.label}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {group.photos.map((photo) => (
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
                  {photo.caption && (
                    <p className="truncate px-2 py-1.5 text-left text-xs text-[var(--muted-text)]">
                      {photo.caption}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

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
                <label htmlFor="edit-photo-taken-at" className="text-sm">
                  {t("takenAt")}
                </label>
                <input
                  id="edit-photo-taken-at"
                  type="date"
                  value={takenAtDraft}
                  onChange={(event) => setTakenAtDraft(event.target.value)}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none"
                />

                <label htmlFor="edit-photo-caption" className="text-sm">
                  {t("caption")}
                </label>
                <input
                  id="edit-photo-caption"
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
                      const data = new FormData();
                      data.set("caption", captionDraft);
                      data.set("taken_at", takenAtDraft);
                      startTransition(async () => {
                        try {
                          await updateFamilyPhoto(
                            familyId,
                            lightboxPhoto.id,
                            data
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
                    {pending ? t("saving") : t("save")}
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
                          await deleteFamilyPhoto(familyId, lightboxPhoto.id);
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
              <div className="text-center text-white/90">
                <p>
                  {formatTakenAt(
                    lightboxPhoto.taken_at,
                    locale,
                    t("unknownDate")
                  )}
                </p>
                {lightboxPhoto.caption && (
                  <p className="mt-1">{lightboxPhoto.caption}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
