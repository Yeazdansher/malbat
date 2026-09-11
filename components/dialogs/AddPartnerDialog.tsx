"use client";

import { useState } from "react";
import AddPersonDialog from "./AddPersonDialog";
import { createRelationship } from "@/app/family/[id]/actions";

type Props = {
  open: boolean;
  onClose: () => void;

  familyId: string;
  relatedPersonId: string;
  canCreateNew: boolean;

  persons: {
    id: string;
    first_name: string;
    last_name: string;
  }[];
};

export default function AddPartnerDialog({
  open,
  onClose,
  familyId,
  relatedPersonId,
  canCreateNew,
  persons,
}: Props) {
  const [mode, setMode] =
    useState<"new" | "existing">(
      canCreateNew ? "new" : "existing"
    );

  const [selectedPersonId, setSelectedPersonId] =
    useState("");

  const [addPersonOpen, setAddPersonOpen] =
    useState(false);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">

          <h2 className="text-2xl font-bold text-green-700">
            Partner hinzufügen
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
                onChange={(e) =>
                  setSelectedPersonId(e.target.value)
                }
              >

                <option value="">
                  Bitte auswählen
                </option>

                {persons
                  .filter(
                    (p) =>
                      p.id !== relatedPersonId
                  )
                  .map((person) => (
                    <option
                      key={person.id}
                      value={person.id}
                    >
                      {person.first_name}{" "}
                      {person.last_name}
                    </option>
                  ))}

              </select>

            </div>

          )}

          <div className="mt-8 flex justify-end gap-3">

            <button
              onClick={onClose}
              className="rounded-lg border px-5 py-3"
            >
              Abbrechen
            </button>

            <button
              onClick={async () => {

                if (mode === "new") {
                  setAddPersonOpen(true);
                  return;
                }

                if (!selectedPersonId) {
                  return;
                }

                await createRelationship(
                  familyId,
                  relatedPersonId,
                  selectedPersonId,
                  "partner"
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
        relatedPersonId={relatedPersonId}
        relationshipType="partner"
      />

    </>
  );
}