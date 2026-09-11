"use client";

import { formatDate } from "@/lib/dates";

type PersonDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;

  firstName: string;
  lastName: string;
  gender: "male" | "female" | "unknown";
  age: number;
  birthDate: string | null;
  birthPlace: string | null;
  isDeceased: boolean;
  deathDate: string | null;
  deathPlace: string | null;
  notes: string | null;
};

export default function PersonDetailsDialog({
  open,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  firstName,
  lastName,
  gender,
  age,
  birthDate,
  birthPlace,
  isDeceased,
  deathDate,
  deathPlace,
  notes,
}: PersonDetailsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">

        <div className="flex items-center gap-5">

          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-green-700 text-2xl font-bold text-white">
            {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              {firstName} {lastName}
            </h2>

            <p className="text-gray-500">
              {gender === "male"
                ? "Männlich"
                : gender === "female"
                ? "Weiblich"
                : "Unbekannt"}
            </p>
          </div>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">

          <div>
            <p className="font-semibold">Alter</p>
            <p>{age} Jahre</p>
          </div>

          <div>
            <p className="font-semibold">Verstorben</p>
            <p>{isDeceased ? "Ja" : "Nein"}</p>
          </div>

          <div>
            <p className="font-semibold">Geburtsdatum</p>
            <p>{formatDate(birthDate)}</p>
          </div>

          <div>
            <p className="font-semibold">Geburtsort</p>
            <p>{birthPlace || "-"}</p>
          </div>

          {isDeceased && (
            <>
              <div>
                <p className="font-semibold">Sterbedatum</p>
                <p>{formatDate(deathDate)}</p>
              </div>

              <div>
                <p className="font-semibold">Sterbeort</p>
                <p>{deathPlace || "-"}</p>
              </div>
            </>
          )}

        </div>

        <div className="mt-6">
          <p className="font-semibold">Notizen</p>

          <div className="mt-2 min-h-24 rounded-lg border bg-gray-50 p-3">
            {notes || "-"}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">

          {canEdit ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg bg-red-600 px-5 py-3 text-white transition hover:bg-red-700"
            >
              Person löschen
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-3">

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setTimeout(() => onEdit(), 0);
                }}
                className="rounded-lg bg-green-700 px-5 py-3 text-white transition hover:bg-green-800"
              >
                Bearbeiten
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-3 transition hover:bg-gray-100"
            >
              Schließen
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}