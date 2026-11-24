"use client";

import { useEffect, useState, useTransition } from "react";

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
  year: string | null;
  dayLabel: string;
  monthLabel: string;
  fullLabel: string;
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

function buildDateLabels(
  value: string | null,
  locale: string,
  unknownLabel: string
) {
  if (!value) {
    return {
      year: null,
      dayLabel: "–",
      monthLabel: unknownLabel,
      fullLabel: unknownLabel,
    };
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return {
      year: null,
      dayLabel: "–",
      monthLabel: value,
      fullLabel: value,
    };
  }

  return {
    year: String(date.getFullYear()),
    dayLabel: String(date.getDate()),
    monthLabel: new Intl.DateTimeFormat(locale, { month: "short" }).format(date),
    fullLabel: formatTakenAt(value, locale, unknownLabel),
  };
}

function todayDateInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function sortPhotosByTimeline(photos: FamilyPhoto[]): FamilyPhoto[] {
  return photos.slice().sort((a, b) => {
    if (a.taken_at && b.taken_at) {
      const byDate = b.taken_at.localeCompare(a.taken_at);
      if (byDate !== 0) return byDate;
    } else if (a.taken_at) {
      return -1;
    } else if (b.taken_at) {
      return 1;
    }

    return b.created_at.localeCompare(a.created_at);
  });
}

function groupPhotosByDate(
  photos: FamilyPhoto[],
  locale: string,
  unknownLabel: string
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const photo of sortPhotosByTimeline(photos)) {
    const key = photo.taken_at ?? "unknown";
    const existing = groups.get(key);
    if (existing) {
      existing.photos.push(photo);
      continue;
    }

    const labels = buildDateLabels(photo.taken_at, locale, unknownLabel);
    groups.set(key, {
      key,
      year: labels.year,
      dayLabel: labels.dayLabel,
      monthLabel: labels.monthLabel,
      fullLabel: labels.fullLabel,
      photos: [photo],
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === "unknown") return 1;
    if (b.key === "unknown") return -1;
    return b.key.localeCompare(a.key);
  });
}

function photoGridClass(count: number) {
  if (count === 1) {
    return "grid w-full max-w-xs grid-cols-1 justify-items-start";
  }
  if (count === 2) {
    return "grid w-full max-w-xl grid-cols-2 gap-3 justify-items-start";
  }
  return "grid w-full grid-cols-2 gap-3 justify-items-start sm:grid-cols-3 lg:grid-cols-4";
}

function isFrameworkError(message: string) {
  return /Minified React error/i.test(message);
}

export default function FamilyPhotoTimeline({
  familyId,
  photos,
  canEdit,
  locale,
  emptyMessage,
}: Props) {
  const t = useTranslations("memories");
  const [items, setItems] = useState(photos);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [takenAtDraft, setTakenAtDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(photos);
  }, [photos]);

  const lightboxPhoto = items.find((photo) => photo.id === lightboxId) ?? null;
  const groups = groupPhotosByDate(items, locale, t("unknownDate"));

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

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-[var(--muted-text)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ol className="relative">
        <div
          aria-hidden
          className="absolute top-4 bottom-4 left-6 w-px bg-gradient-to-b from-[#1f7a45]/55 via-[var(--border)] to-transparent"
        />

        {groups.map((group, index) => {
          const prevYear = index > 0 ? groups[index - 1]?.year : null;
          const showYear = Boolean(group.year) && group.year !== prevYear;

          return (
            <li key={group.key} className="relative pb-10 last:pb-2">
              {showYear && (
                <div className="mb-6 flex items-center gap-3 pl-14">
                  <p
                    className="text-3xl font-semibold tracking-tight text-green-800 dark:text-[#8fd4a8]"
                    style={{ fontFamily: "var(--font-malbat), serif" }}
                  >
                    {group.year}
                  </p>
                  <div className="h-px max-w-xs flex-1 bg-[var(--border)]" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="relative z-[1] flex w-12 shrink-0 flex-col items-center">
                  <div
                    className="flex h-12 w-12 flex-col items-center justify-center rounded-full border border-[#1f7a45]/30 bg-[var(--card-bg)] shadow-[0_0_0_4px_var(--page-bg)]"
                    title={group.fullLabel}
                  >
                    <span className="text-base leading-none font-semibold text-[var(--card-text)]">
                      {group.dayLabel}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-none tracking-wide text-[#1f7a45] uppercase dark:text-[#8fd4a8]">
                      {group.monthLabel}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="sr-only">{group.fullLabel}</h2>

                  <ul className={photoGridClass(group.photos.length)}>
                    {group.photos.map((photo) => (
                      <li key={photo.id} className="w-full">
                        <button
                          type="button"
                          onClick={() => openLightbox(photo)}
                          className="group relative block w-full overflow-hidden rounded-2xl bg-[var(--card-bg)] ring-1 ring-[var(--border)] transition duration-300 hover:-translate-y-0.5 hover:ring-[#1f7a45]/40 hover:shadow-[0_12px_30px_-18px_rgba(31,122,69,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                          aria-label={photo.caption || t("enlargePhoto")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || ""}
                            className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                          {photo.caption && (
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                              <span className="line-clamp-2">{photo.caption}</span>
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

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
                  max={todayDateInputValue()}
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
                      const nextCaption = captionDraft.trim() || null;
                      const nextTakenAt = takenAtDraft.trim() || null;
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
                          setItems((current) =>
                            sortPhotosByTimeline(
                              current.map((photo) =>
                                photo.id === lightboxPhoto.id
                                  ? {
                                      ...photo,
                                      caption: nextCaption,
                                      taken_at: nextTakenAt,
                                    }
                                  : photo
                              )
                            )
                          );
                          closeLightbox();
                        } catch (err) {
                          const message =
                            err instanceof Error
                              ? err.message
                              : t("saveFailed");
                          if (isFrameworkError(message)) {
                            setItems((current) =>
                              sortPhotosByTimeline(
                                current.map((photo) =>
                                  photo.id === lightboxPhoto.id
                                    ? {
                                        ...photo,
                                        caption: nextCaption,
                                        taken_at: nextTakenAt,
                                      }
                                    : photo
                                )
                              )
                            );
                            closeLightbox();
                            return;
                          }
                          setError(message);
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
                      const photoId = lightboxPhoto.id;
                      startTransition(async () => {
                        try {
                          await deleteFamilyPhoto(familyId, photoId);
                          setItems((current) =>
                            current.filter((photo) => photo.id !== photoId)
                          );
                          closeLightbox();
                        } catch (err) {
                          const message =
                            err instanceof Error
                              ? err.message
                              : t("deleteFailed");
                          if (isFrameworkError(message)) {
                            setItems((current) =>
                              current.filter((photo) => photo.id !== photoId)
                            );
                            closeLightbox();
                            return;
                          }
                          setError(message);
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
