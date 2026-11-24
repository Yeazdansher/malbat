"use client";

import { useRef, useState, useTransition } from "react";

import { uploadFamilyPhoto } from "@/app/family/[id]/memories/actions";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  familyId: string;
};

function todayDateInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isFrameworkError(message: string) {
  return /Minified React error|NEXT_REDIRECT|NEXT_NOT_FOUND|digest/i.test(
    message
  );
}

export default function UploadFamilyPhotoForm({ familyId }: Props) {
  const t = useTranslations("memories");
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const maxDate = todayDateInputValue();

  return (
    <form
      ref={formRef}
      className="surface-card mt-8 space-y-4 rounded-2xl border p-6 shadow-sm"
      action={(formData) => {
        setError("");
        startTransition(async () => {
          try {
            await uploadFamilyPhoto(familyId, formData);
            formRef.current?.reset();
          } catch (err) {
            const message =
              err instanceof Error ? err.message : t("uploadFailed");
            // revalidatePath can surface RSC errors on the action promise;
            // the upload itself may still have succeeded.
            if (isFrameworkError(message)) {
              formRef.current?.reset();
              return;
            }
            setError(message);
          }
        });
      }}
    >
      <h2 className="text-lg font-semibold text-green-700 dark:text-[#8fd4a8]">
        {t("uploadPhoto")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="photo-file" className="mb-1 block text-sm font-medium">
            {t("photoFile")}
          </label>
          <input
            id="photo-file"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--card-text)] file:mr-3 file:rounded-md file:border-0 file:bg-[#1f7a45] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-green-700 focus:outline-none"
          />
          <p className="mt-1 text-sm text-[var(--muted-text)]">{t("uploadHint")}</p>
        </div>

        <div>
          <label
            htmlFor="photo-taken-at"
            className="mb-1 block text-sm font-medium"
          >
            {t("takenAt")}
          </label>
          <input
            id="photo-taken-at"
            name="taken_at"
            type="date"
            max={maxDate}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--card-text)] focus:border-green-700 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="photo-caption"
            className="mb-1 block text-sm font-medium"
          >
            {t("caption")}
          </label>
          <input
            id="photo-caption"
            name="caption"
            maxLength={200}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--card-text)] focus:border-green-700 focus:outline-none"
            placeholder={t("captionPlaceholder")}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#1f7a45] px-5 py-2.5 font-semibold text-white hover:bg-[#19653a] disabled:opacity-60"
      >
        {pending ? t("uploading") : t("uploadPhoto")}
      </button>
    </form>
  );
}
