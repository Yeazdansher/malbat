"use client";

import { useState } from "react";
import { deletePerson } from "@/app/family/[id]/actions";

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
            Person kann nicht gelöscht werden
          </h2>

          <p className="mt-4 text-gray-700">
            Diese Person kann nicht gelöscht werden, da sie noch Kinder
            besitzt. Bitte lösche zuerst alle Kinder dieser Person.
          </p>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
            >
              OK
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
          Person löschen
        </h2>

        <p className="mt-4 whitespace-pre-line text-gray-700">
          {`Möchtest du diese Person wirklich löschen?
Diese Aktion kann nicht rückgängig gemacht werden.`}
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
            Abbrechen
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
                window.location.reload();
              } catch (caught) {
                setSaving(false);
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Die Person konnte nicht gelöscht werden."
                );
              }
            }}
          >
            Person löschen
          </button>
        </div>
      </div>
    </div>
  );
}
