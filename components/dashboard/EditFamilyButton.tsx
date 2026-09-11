"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { updateFamilyDetails } from "@/app/dashboard/actions";

type Props = {
  familyId: string;
  initialName: string;
  initialDescription: string | null;
  buttonClassName?: string;
  onClose?: () => void;
};

export default function EditFamilyButton({
  familyId,
  initialName,
  initialDescription,
  buttonClassName,
  onClose,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(
    initialDescription ?? ""
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setName(initialName);
    setDescription(initialDescription ?? "");
    setError("");
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setName(initialName);
    setDescription(initialDescription ?? "");
    setError("");
    onClose?.();
  }

  async function save() {
    setError("");
    setSaving(true);

    try {
      const result = await updateFamilyDetails(
        familyId,
        name,
        description
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOpen(false);
      onClose?.();
      router.refresh();
    } catch {
      setError(
        "Der Stammbaum konnte nicht gespeichert werden. Bitte versuche es erneut."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={
          buttonClassName ?? "text-sm text-green-700 hover:underline"
        }
      >
        Bearbeiten
      </button>

      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-family-${familyId}`}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id={`edit-family-${familyId}`}
                className="text-2xl font-bold text-green-700"
              >
                Stammbaum bearbeiten
              </h2>
              <button
                type="button"
                onClick={close}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label="Fenster schließen"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor={`family-name-${familyId}`}
                  className="mb-2 block font-medium"
                >
                  Name
                </label>
                <input
                  id={`family-name-${familyId}`}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border p-3"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor={`family-description-${familyId}`}
                  className="mb-2 block font-medium"
                >
                  Beschreibung
                </label>
                <textarea
                  id={`family-description-${familyId}`}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  maxLength={1000}
                  rows={5}
                  className="w-full resize-y rounded-lg border p-3"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100 disabled:opacity-60"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !name.trim()}
                className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800 disabled:opacity-60"
              >
                {saving ? "Speichern …" : "Speichern"}
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
