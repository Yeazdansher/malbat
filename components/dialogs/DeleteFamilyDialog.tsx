"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFamilyTree } from "@/app/family/[id]/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  familyId: string;
};

export default function DeleteFamilyDialog({
  open,
  onClose,
  familyId,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return null;
  }

  function close() {
    setStep(1);
    setPassword("");
    setError("");
    setSaving(false);
    onClose();
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-green-700">
            Stammbaum löschen
          </h2>

          <div className="mt-4 space-y-3 text-gray-700">
            <p>Du bist dabei, den gesamten Stammbaum dauerhaft zu löschen.</p>
            <p>
              Dabei werden alle Personen, Beziehungen, Bilder, Dokumente,
              Einladungen und sämtliche Daten dieses Stammbaums unwiderruflich
              entfernt.
            </p>
            <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border px-5 py-3 hover:bg-gray-100"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep(2);
              }}
              className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-green-700">
          Identität bestätigen
        </h2>

        <p className="mt-4 text-gray-700">
          Bitte gib dein Kontopasswort ein, um den Stammbaum endgültig zu
          löschen.
        </p>

        <label className="mt-6 mb-2 block font-medium">Passwort</label>
        <input
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border p-3"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p className="mt-4 text-red-600">{error}</p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border px-5 py-3 hover:bg-gray-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={saving || password.trim().length === 0}
            className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-60"
            onClick={async () => {
              setError("");
              setSaving(true);

              try {
                const result = await deleteFamilyTree(familyId, password);

                if (!result.ok) {
                  setSaving(false);
                  setError(result.error);
                  return;
                }

                router.push("/dashboard?familyDeleted=1");
              } catch {
                setSaving(false);
                setError(
                  "Es ist ein Fehler aufgetreten. Bitte versuche es erneut."
                );
              }
            }}
          >
            Stammbaum endgültig löschen
          </button>
        </div>
      </div>
    </div>
  );
}
