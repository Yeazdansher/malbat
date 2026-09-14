"use client";

import { useMemo, useState } from "react";

import { resetPassword } from "@/app/reset-password/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRulesChecklist } from "@/components/PasswordRulesChecklist";
import { isValidPassword } from "@/lib/password";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordOk = useMemo(() => isValidPassword(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = passwordOk && passwordsMatch;

  return (
    <form
      action={resetPassword}
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        if (!canSubmit) {
          event.preventDefault();
        }
      }}
    >
      <div>
        <label htmlFor="password" className="mb-2 block font-medium">
          Neues Passwort
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
          required
          autoFocus
          aria-describedby="password-rules"
        />
      </div>

      <div id="password-rules">
        <PasswordRulesChecklist password={password} />
      </div>

      <div>
        <label
          htmlFor="password_confirmation"
          className="mb-2 block font-medium"
        >
          Neues Passwort bestätigen
        </label>
        <PasswordInput
          id="password_confirmation"
          name="password_confirmation"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
          required
        />
      </div>

      {confirmPassword.length > 0 && !passwordsMatch && (
        <p className="text-sm text-red-600">
          Die Passwörter stimmen nicht überein.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-[#1f7a45] py-3 font-semibold text-white transition hover:bg-[#19653a] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
      >
        Passwort speichern
      </button>
    </form>
  );
}
