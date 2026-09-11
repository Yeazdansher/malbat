"use client";

import { useState } from "react";

import { createPerson } from "@/app/family/[id]/actions";

type AddPersonDialogProps = {
  familyId: string;
  open: boolean;
  onClose: () => void;

  relatedPersonId?: string;
  secondRelatedPersonId?: string;
  relationshipType?: string;
};

export default function AddPersonDialog({
  familyId,
  open,
  onClose,
  relatedPersonId,
  secondRelatedPersonId,
  relationshipType,
}: AddPersonDialogProps) {
  const [isDeceased, setIsDeceased] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">

        <h2 className="text-2xl font-bold text-green-700">
          Person hinzufügen
        </h2>

        <form
          action={createPerson.bind(null, familyId)}
          className="mt-8 space-y-5"
        >
        
        <input
  type="hidden"
  name="related_person_id"
  value={relatedPersonId ?? ""}
/>

<input
  type="hidden"
  name="second_related_person_id"
  value={secondRelatedPersonId ?? ""}
/>

<input
  type="hidden"
  name="relationship_type"
  value={relationshipType ?? ""}
/>
          <div>
            <label className="mb-2 block font-medium">
              Vorname *
            </label>

            <input
              name="first_name"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Nachname *
            </label>

            <input
              name="last_name"
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Geschlecht *
            </label>

            <select
              name="gender"
              className="w-full rounded-lg border p-3"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Bitte auswählen
              </option>

              <option value="male">
                Männlich
              </option>

              <option value="female">
                Weiblich
              </option>

              <option value="unknown">
                Unbekannt
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Geburtsdatum
            </label>

            <input
              type="date"
              name="birth_date"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Geburtsort
            </label>

            <input
              name="birth_place"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_deceased"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
            />

            Verstorben
          </label>

          {isDeceased && (
            <>
              <div>
                <label className="mb-2 block font-medium">
                  Sterbedatum
                </label>

                <input
                  type="date"
                  name="death_date"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Sterbeort
                </label>

                <input
                  name="death_place"
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block font-medium">
              Notizen
            </label>

            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-3"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
            >
              Speichern
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}