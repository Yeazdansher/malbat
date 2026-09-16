"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  removePersonPhoto,
  updatePerson,
  uploadPersonPhoto,
} from "@/app/family/[id]/actions";

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
    photo_url?: string | null;
  };
};

export default function EditPersonDialog({
  open,
  onClose,
  familyId,
  personId,
  person,
}: EditPersonDialogProps) {
  const router = useRouter();
  const [isDeceased, setIsDeceased] = useState(person.is_deceased);
  const [pendingPhoto, startPhotoTransition] = useTransition();
  const [pendingSave, startSaveTransition] = useTransition();
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const initials =
    `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-green-700">
          Person bearbeiten
        </h2>

        <div className="mt-6 flex items-center gap-4">
          {person.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo_url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-green-700 text-2xl font-bold text-white">
              {initials}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                const data = new FormData();
                data.set("photo", file);

                startPhotoTransition(async () => {
                  await uploadPersonPhoto(familyId, personId, data);
                  router.refresh();
                });
              }}
            />

            <button
              type="button"
              disabled={pendingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="text-left text-sm text-green-700 hover:underline disabled:opacity-60"
            >
              {person.photo_url ? "Foto ändern" : "Foto hochladen"}
            </button>

            {person.photo_url && (
              <button
                type="button"
                disabled={pendingPhoto}
                onClick={() => {
                  startPhotoTransition(async () => {
                    await removePersonPhoto(familyId, personId);
                    router.refresh();
                  });
                }}
                className="text-left text-sm text-red-600 hover:underline disabled:opacity-60"
              >
                Foto entfernen
              </button>
            )}
          </div>
        </div>

        <form
          className="mt-8 space-y-5"
          action={(formData) => {
            startSaveTransition(async () => {
              await updatePerson(familyId, personId, formData);
              onClose();
              router.refresh();
            });
          }}
        >
          <div>
            <label className="mb-2 block font-medium">Vorname *</label>
            <input
              name="first_name"
              defaultValue={person.first_name}
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Nachname *</label>
            <input
              name="last_name"
              defaultValue={person.last_name}
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Geschlecht *</label>
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
            <label className="mb-2 block font-medium">Geburtsdatum</label>
            <input
              type="date"
              name="birth_date"
              defaultValue={person.birth_date ?? ""}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Geburtsort</label>
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
                <label className="mb-2 block font-medium">Sterbedatum</label>
                <input
                  type="date"
                  name="death_date"
                  defaultValue={person.death_date ?? ""}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Sterbeort</label>
                <input
                  name="death_place"
                  defaultValue={person.death_place ?? ""}
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block font-medium">Notizen</label>
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
              disabled={pendingSave}
            >
              Abbrechen
            </button>

            <button
              type="submit"
              disabled={pendingSave}
              className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800 disabled:opacity-60"
            >
              {pendingSave ? "Speichern…" : "Änderungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
