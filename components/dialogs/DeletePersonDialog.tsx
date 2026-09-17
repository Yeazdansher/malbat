"use client";

import { useState } from "react";
import { deletePerson } from "@/app/family/[id]/actions";
import { useTreeRefresh } from "@/components/family/useTreeRefresh";
import { useTranslations } from "@/lib/i18n/client";

type Props = {
  open: boolean;
  onClose: () => void;
  hasChildren: boolean;
  familyId: string;
  personId: string;
};

export default function DeletePersonDialog({
  open,
  onClose,
  hasChildren,
  familyId,
  personId,
}: Props) {
  const t = useTranslations("deletePerson");
  const refreshTree = useTreeRefresh();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(hasChildren);

  if (!open) {
    return null;
  }

  if (hasChildren || blocked) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-green-700">
            {t("blockedTitle")}
          </h2>

          <p className="mt-4 text-gray-700">{t("blockedBody")}</p>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
            >
              {t("ok")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-green-700">
          {t("title")}
        </h2>

        <p className="mt-4 whitespace-pre-line text-gray-700">
          {t("confirm")}
        </p>

        {error && (
          <p className="mt-4 text-red-600">{error}</p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-5 py-3 hover:bg-gray-100"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-60"
            onClick={async () => {
              setError("");
              setSaving(true);

              try {
                const result = await deletePerson(familyId, personId);

                if (!result.ok) {
                  setSaving(false);
                  setBlocked(true);
                  return;
                }

                onClose();
                refreshTree();
              } catch (caught) {
                setSaving(false);
                setError(
                  caught instanceof Error
                    ? caught.message
                    : t("failed")
                );
              }
            }}
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
