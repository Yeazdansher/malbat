"use client";

import { useState } from "react";

import { updatePassword } from "@/app/profile/actions";
import { PASSWORD_REQUIREMENTS } from "@/lib/password";

type Props = {
  error?: string;
};

export default function ChangePasswordButton({ error }: Props) {
  const [open, setOpen] = useState(Boolean(error));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-green-700 hover:underline"
      >
        Passwort ändern
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="change-password-title"
                className="text-2xl font-bold text-green-700"
              >
                Passwort ändern
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label="Fenster schließen"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {PASSWORD_REQUIREMENTS}
            </p>

            <form action={updatePassword} className="mt-6 space-y-4">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </p>
              )}

              <div>
                <label
                  htmlFor="current_password"
                  className="mb-2 block font-medium"
                >
                  Aktuelles Passwort
                </label>
                <input
                  id="current_password"
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border p-3"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="new_password"
                  className="mb-2 block font-medium"
                >
                  Neues Passwort
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirm_password"
                  className="mb-2 block font-medium"
                >
                  Neues Passwort bestätigen
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border px-5 py-3 hover:bg-gray-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
                >
                  Passwort speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
