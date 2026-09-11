"use client";

import { useState } from "react";

import { updatePerson } from "@/app/family/[id]/actions";

type EditPersonDialogProps = {
  open: boolean;
  onClose: () => void;

  familyId: string;
  personId: string;

  person: {
    first_name: string;
    last_name: string;
    gender: "male" | "female" | "unknown";
    birth_date: string | null;
    birth_place: string | null;
    is_deceased: boolean;
    death_date: string | null;
    death_place: string | null;
    notes: string | null;
  };
};

export default function EditPersonDialog({
  open,
  onClose,
  familyId,
  personId,
  person,
}: EditPersonDialogProps) {
  const [isDeceased, setIsDeceased] = useState(
    person.is_deceased
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">

        <h2 className="text-2xl font-bold text-green-700">
          Person bearbeiten
        </h2>

        <form
          action={updatePerson.bind(null, familyId, personId)}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="mb-2 block font-medium">
              Vorname *
            </label>

            <input
              name="first_name"
              defaultValue={person.first_name}
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
              defaultValue={person.last_name}
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
              defaultValue={person.gender}
              className="w-full rounded-lg border p-3"
              required
            >
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="unknown">Unbekannt</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Geburtsdatum
            </label>

            <input
              type="date"
              name="birth_date"
              defaultValue={person.birth_date ?? ""}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Geburtsort
            </label>

            <input
              name="birth_place"
              defaultValue={person.birth_place ?? ""}
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
                  defaultValue={person.death_date ?? ""}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Sterbeort
                </label>

                <input
                  name="death_place"
                  defaultValue={person.death_place ?? ""}
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
              defaultValue={person.notes ?? ""}
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
              Änderungen speichern
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}