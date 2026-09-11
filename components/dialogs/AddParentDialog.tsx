"use client";

import { useState } from "react";
import { createParentsForChild } from "@/app/family/[id]/actions";

type PersonOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;

  familyId: string;
  relatedPersonId: string;
  persons: PersonOption[];
  canCreateNew: boolean;
};

type ParentDraftState = {
  mode: "new" | "existing";
  personId: string;
  firstName: string;
  lastName: string;
};

const emptyParent: ParentDraftState = {
  mode: "new",
  personId: "",
  firstName: "",
  lastName: "",
};

export default function AddParentDialog({
  open,
  onClose,
  familyId,
  relatedPersonId,
  persons,
  canCreateNew,
}: Props) {
  const initialParent = {
    ...emptyParent,
    mode: canCreateNew ? "new" : "existing",
  } satisfies ParentDraftState;
  const [father, setFather] = useState<ParentDraftState>(initialParent);
  const [mother, setMother] = useState<ParentDraftState>(initialParent);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return null;
  }

  const selectablePersons = persons.filter(
    (person) => person.id !== relatedPersonId
  );

  function renderParentFields(
    label: string,
    value: ParentDraftState,
    onChange: (next: ParentDraftState) => void
  ) {
    return (
      <section className="rounded-xl border p-4">
        <h3 className="mb-4 text-lg font-semibold text-green-700">
          {label}
        </h3>

        <label className="mb-3 flex items-center gap-3">
          <input
            type="radio"
            checked={value.mode === "new"}
            disabled={!canCreateNew}
            onChange={() => onChange({ ...value, mode: "new" })}
          />
          Neue Person anlegen
        </label>

        <label className="mb-4 flex items-center gap-3">
          <input
            type="radio"
            checked={value.mode === "existing"}
            onChange={() => onChange({ ...value, mode: "existing" })}
          />
          Vorhandene Person auswählen
        </label>

        {value.mode === "existing" ? (
          <select
            className="w-full rounded-lg border p-3"
            value={value.personId}
            onChange={(event) =>
              onChange({ ...value, personId: event.target.value })
            }
          >
            <option value="">Bitte auswählen</option>
            {selectablePersons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.first_name} {person.last_name}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border p-3"
              placeholder="Vorname *"
              value={value.firstName}
              onChange={(event) =>
                onChange({ ...value, firstName: event.target.value })
              }
            />
            <input
              className="w-full rounded-lg border p-3"
              placeholder="Nachname *"
              value={value.lastName}
              onChange={(event) =>
                onChange({ ...value, lastName: event.target.value })
              }
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-green-700">
          Eltern hinzufügen
        </h2>

        <p className="mt-2 text-gray-600">
          Ein Kind hat immer einen Vater und eine Mutter. Beide Personen
          werden gemeinsam angelegt.
        </p>

        {!canCreateNew && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Das Personenlimit ist erreicht. Du kannst weiterhin vorhandene
            Personen als Eltern auswählen.
          </p>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {renderParentFields("Vater", father, setFather)}
          {renderParentFields("Mutter", mother, setMother)}
        </div>

        {error && (
          <p className="mt-4 text-red-600">{error}</p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-5 py-3"
          >
            Abbrechen
          </button>

          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800 disabled:opacity-60"
            onClick={async () => {
              setError("");
              setSaving(true);

              try {
                await createParentsForChild(
                  familyId,
                  relatedPersonId,
                  father,
                  mother
                );
                onClose();
                window.location.reload();
              } catch (caught) {
                setSaving(false);
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Eltern konnten nicht gespeichert werden."
                );
              }
            }}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
