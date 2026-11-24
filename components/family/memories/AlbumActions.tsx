"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteAlbum, updateAlbum } from "@/app/family/[id]/memories/actions";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  familyId: string;
  albumId: string;
  title: string;
  description: string | null;
  eventDate: string | null;
};

export default function AlbumActions({
  familyId,
  albumId,
  title,
  description,
  eventDate,
}: Props) {
  const t = useTranslations("memories");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(t("confirmDeleteAlbum"))) {
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        await deleteAlbum(familyId, albumId);
        router.push(`/family/${familyId}/memories`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("deleteFailed"));
      }
    });
  }

  if (editing) {
    return (
      <form
        className="surface-card mt-6 space-y-4 rounded-2xl border p-5"
        action={(formData) => {
          setError("");
          startTransition(async () => {
            try {
              await updateAlbum(familyId, albumId, formData);
              setEditing(false);
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : t("saveFailed")
              );
            }
          });
        }}
      >
        <div>
          <label
            htmlFor="edit-album-title"
            className="mb-1 block text-sm font-medium"
          >
            {t("albumTitle")}
          </label>
          <input
            id="edit-album-title"
            name="title"
            required
            defaultValue={title}
            maxLength={120}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 focus:border-green-700 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-album-date"
            className="mb-1 block text-sm font-medium"
          >
            {t("eventDate")}
          </label>
          <input
            id="edit-album-date"
            name="event_date"
            type="date"
            defaultValue={eventDate ?? ""}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 focus:border-green-700 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-album-description"
            className="mb-1 block text-sm font-medium"
          >
            {t("description")}
          </label>
          <textarea
            id="edit-album-description"
            name="description"
            rows={3}
            defaultValue={description ?? ""}
            maxLength={500}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 focus:border-green-700 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#1f7a45] px-4 py-2 text-white hover:bg-[#19653a] disabled:opacity-60"
          >
            {pending ? t("saving") : t("save")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setError("");
            }}
            className="rounded-lg border border-[var(--border)] px-4 py-2 hover:bg-[var(--page-bg)]"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--page-bg)]"
      >
        {t("editAlbum")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? t("deleting") : t("deleteAlbum")}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
