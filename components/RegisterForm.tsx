"use client";

import { useMemo, useState } from "react";

import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRulesChecklist } from "@/components/PasswordRulesChecklist";
import { isValidPassword } from "@/lib/password";
import { registerUser } from "@/app/register/actions";

type Props = {
  invite: string;
};

export default function RegisterForm({ invite }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordOk = useMemo(() => isValidPassword(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = passwordOk && passwordsMatch;

  return (
    <form
      action={registerUser}
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        if (!canSubmit) {
          event.preventDefault();
        }
      }}
    >
      {invite && <input type="hidden" name="invite" value={invite} />}

      <input
        name="firstName"
        type="text"
        placeholder="Vorname"
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
        required
      />

      <input
        name="lastName"
        type="text"
        placeholder="Nachname"
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
        required
      />

      <input
        name="username"
        type="text"
        placeholder="Benutzername"
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
        required
      />

      <input
        name="email"
        type="email"
        placeholder="E-Mail"
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
        required
      />

      <PasswordInput
        name="password"
        placeholder="Passwort"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
        required
        aria-describedby="password-rules"
      />

      <div id="password-rules">
        <PasswordRulesChecklist password={password} />
      </div>

      <PasswordInput
        name="confirmPassword"
        placeholder="Passwort wiederholen"
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-700 focus:outline-none"
        required
      />

      {confirmPassword.length > 0 && !passwordsMatch && (
        <p className="text-sm text-red-600">
          Die Passwörter stimmen nicht überein.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-green-700 py-3 text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
      >
        Registrieren
      </button>
    </form>
  );
}
