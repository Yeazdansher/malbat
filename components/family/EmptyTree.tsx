"use client";

import { useState } from "react";

import AddPersonDialog from "@/components/dialogs/AddPersonDialog";
import { useTranslations } from "@/lib/i18n/client";

type EmptyTreeProps = {
  familyId: string;
  canEdit: boolean;
};

export default function EmptyTree({
  familyId,
  canEdit,
}: EmptyTreeProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("tree");

  return (
    <>
      <div className="flex h-[650px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white">
        <div className="text-center">
          <div className="text-7xl">👨‍👩‍👧‍👦</div>

          <h2 className="mt-6 text-2xl font-semibold">{t("emptyTitle")}</h2>

          <p className="mt-2 text-gray-600">{t("emptyBody")}</p>

          {canEdit && (
            <button
              onClick={() => setOpen(true)}
              className="mt-8 rounded-lg bg-green-700 px-6 py-3 text-white hover:bg-green-800"
            >
              {t("addFirstPerson")}
            </button>
          )}
        </div>
      </div>

      <AddPersonDialog
        familyId={familyId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
