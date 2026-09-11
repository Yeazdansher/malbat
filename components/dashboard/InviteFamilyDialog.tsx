"use client";

import { useState } from "react";

import { createFamilyInvitation } from "@/app/dashboard/actions";
import type { InvitationRole } from "@/lib/invitations";

type Props = {
  open: boolean;
  onClose: () => void;
  familyId: string;
  familyName: string;
};

export default function InviteFamilyDialog({
  open,
  onClose,
  familyId,
  familyName,
}: Props) {
  const [role, setRole] = useState<InvitationRole>("viewer");
  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) {
    return null;
  }

  function close() {
    setLink("");
    setExpiresAt("");
    setError("");
    setCopied(false);
    setCreating(false);
    onClose();
  }

  async function createLink() {
    setCreating(true);
    setError("");
    setCopied(false);

    try {
      const result = await createFamilyInvitation(familyId, role);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setLink(`${window.location.origin}${result.path}`);
      setExpiresAt(result.expiresAt);
    } catch {
      setError(
        "Der Einladungslink konnte nicht erstellt werden. Bitte versuche es erneut."
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Der Link konnte nicht kopiert werden.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-family-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="invite-family-title"
              className="text-2xl font-bold text-green-700"
            >
              Zum Stammbaum einladen
            </h2>
            <p className="mt-1 text-gray-600">{familyName}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="Fenster schließen"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="invitation-role" className="mb-2 block font-medium">
            Rolle
          </label>
          <select
            id="invitation-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as InvitationRole);
              setLink("");
              setExpiresAt("");
              setCopied(false);
            }}
            disabled={creating}
            className="w-full rounded-lg border p-3"
          >
            <option value="viewer">Betrachter – nur ansehen</option>
            <option value="editor">Bearbeiter – Personen bearbeiten</option>
          </select>
        </div>

        {!link ? (
          <button
            type="button"
            onClick={createLink}
            disabled={creating}
            className="mt-6 w-full rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800 disabled:opacity-60"
          >
            {creating ? "Link wird erstellt …" : "Einladungslink erstellen"}
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <label htmlFor="invitation-link" className="block font-medium">
              Einladungslink
            </label>
            <div className="flex gap-2">
              <input
                id="invitation-link"
                type="text"
                value={link}
                readOnly
                className="min-w-0 flex-1 rounded-lg border bg-gray-50 p-3"
              />
              <button
                type="button"
                onClick={copyLink}
                className="rounded-lg bg-green-700 px-4 py-3 text-white hover:bg-green-800"
              >
                {copied ? "Kopiert" : "Kopieren"}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Einmalig verwendbar, gültig bis{" "}
              {new Date(expiresAt).toLocaleString("de-DE")}.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border px-5 py-3 hover:bg-gray-100"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
