"use client";

import { useEffect, useState } from "react";

import UploadFamilyPhotoForm from "@/components/family/memories/UploadFamilyPhotoForm";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  familyId: string;
};

export default function AddPhotosButton({ familyId }: Props) {
  const t = useTranslations("memories");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-lg bg-[#1f7a45] px-4 text-sm font-semibold text-white hover:bg-[#19653a]"
      >
        {t("addPhotos")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("addPhotos")}
          onClick={() => setOpen(false)}
        >
          <div
            className="surface-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold text-green-700 dark:text-[#8fd4a8]">
                {t("uploadPhoto")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-xl leading-none text-[var(--muted-text)] hover:bg-[var(--page-bg)]"
                aria-label={t("closePhoto")}
              >
                ×
              </button>
            </div>

            <UploadFamilyPhotoForm
              familyId={familyId}
              embedded
              onSuccess={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
