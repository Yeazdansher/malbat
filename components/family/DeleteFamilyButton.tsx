"use client";

import { useState } from "react";
import DeleteFamilyDialog from "@/components/dialogs/DeleteFamilyDialog";

type Props = {
  familyId: string;
};

export default function DeleteFamilyButton({ familyId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-600 px-5 py-3 text-red-600 hover:bg-red-50"
      >
        Stammbaum löschen
      </button>

      <DeleteFamilyDialog
        open={open}
        onClose={() => setOpen(false)}
        familyId={familyId}
      />
    </>
  );
}
