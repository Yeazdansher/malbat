"use client";

import { useState } from "react";
import AddPersonDialog from "./AddPersonDialog";
import { addChildToParents } from "@/app/family/[id]/actions";

type Props = {
  open: boolean;
  onClose: () => void;

  familyId: string;
  parentIds: string[];
  canCreateNew: boolean;

  persons: {
    id: string;
    first_name: string;
    last_name: string;
  }[];
};

export default function AddChildDialog({
  open,
  onClose,
  familyId,
  parentIds,
  canCreateNew,
  persons,
}: Props) {
  const [mode, setMode] = useState<"new" | "existing">(
    canCreateNew ? "new" : "existing"
  );
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [addPersonOpen, setAddPersonOpen] = useState(false);

  if (!open) {
    return null;
  }

  const parentIdSet = new Set(parentIds);
  const firstParentId = parentIds[0] ?? "";
  const secondParentId = parentIds[1];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-green-700">
            Kind hinzufügen
          </h2>

          <div className="mt-8">
            {!canCreateNew && (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Das Personenlimit ist erreicht. Du kannst weiterhin eine
                vorhandene Person auswählen.
              </p>
            )}
            <label className="mb-3 flex items-center gap-3">
              <input
                type="radio"
                checked={mode === "new"}
                disabled={!canCreateNew}
                onChange={() => setMode("new")}
              />
              Neue Person anlegen
            </label>

            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
              />
              Vorhandene Person auswählen
            </label>
          </div>

          {mode === "existing" && (
            <div className="mt-6">
              <label className="mb-2 block font-medium">
                Person auswählen
              </label>

              <select
                className="w-full rounded-lg border p-3"
                value={selectedPersonId}
                onChange={(event) =>
                  setSelectedPersonId(event.target.value)
                }
              >
                <option value="">Bitte auswählen</option>

                {persons
                  .filter((person) => !parentIdSet.has(person.id))
                  .map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.first_name} {person.last_name}
                    </option>
                  ))}
              </select>
            </div>
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
              onClick={async () => {
                if (mode === "new") {
                  setAddPersonOpen(true);
                  return;
                }

                if (!selectedPersonId) {
                  return;
                }

                await addChildToParents(
                  familyId,
                  selectedPersonId,
                  parentIds
                );

                onClose();
                window.location.reload();
              }}
              className="rounded-lg bg-green-700 px-5 py-3 text-white"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>

      <AddPersonDialog
        open={addPersonOpen}
        onClose={() => setAddPersonOpen(false)}
        familyId={familyId}
        relatedPersonId={firstParentId}
        secondRelatedPersonId={secondParentId}
        relationshipType="son"
      />
    </>
  );
}
