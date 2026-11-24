"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createAlbum } from "@/app/family/[id]/memories/actions";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  familyId: string;
};

export default function CreateAlbumForm({ familyId }: Props) {
  const t = useTranslations("memories");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#1f7a45] px-5 py-3 font-semibold text-white hover:bg-[#19653a]"
      >
        {t("createAlbum")}
      </button>
    );
  }

  return (
    <form
      className="surface-card w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-sm"
      action={(formData) => {
        setError("");
        startTransition(async () => {
          try {
            const album = await createAlbum(familyId, formData);
            setOpen(false);
            router.push(`/family/${familyId}/memories/${album.id}`);
            router.refresh();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : t("createFailed")
            );
          }
        });
      }}
    >
      <h2 className="text-lg font-semibold text-green-700 dark:text-[#8fd4a8]">
        {t("createAlbum")}
      </h2>

      <div>
        <label htmlFor="album-title" className="mb-1 block text-sm font-medium">
          {t("albumTitle")}
        </label>
        <input
          id="album-title"
          name="title"
          required
          maxLength={120}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--card-text)] focus:border-green-700 focus:outline-none"
          placeholder={t("albumTitlePlaceholder")}
        />
      </div>

      <div>
        <label
          htmlFor="album-event-date"
          className="mb-1 block text-sm font-medium"
        >
          {t("eventDate")}
        </label>
        <input
          id="album-event-date"
          name="event_date"
          type="date"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--card-text)] focus:border-green-700 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="album-description"
          className="mb-1 block text-sm font-medium"
        >
          {t("description")}
        </label>
        <textarea
          id="album-description"
          name="description"
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--card-text)] focus:border-green-700 focus:outline-none"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#1f7a45] px-5 py-2.5 font-semibold text-white hover:bg-[#19653a] disabled:opacity-60"
        >
          {pending ? t("creating") : t("create")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 hover:bg-[var(--page-bg)] disabled:opacity-60"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
