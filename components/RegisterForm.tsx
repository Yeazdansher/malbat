"use client";

import { useMemo, useState } from "react";

import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRulesChecklist } from "@/components/PasswordRulesChecklist";
import { useTranslations } from "@/lib/i18n/client";
import { isValidPassword } from "@/lib/password";
import { registerUser } from "@/app/register/actions";

type Props = {
  invite: string;
};

export default function RegisterForm({ invite }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const t = useTranslations("register");

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
        placeholder={t("firstName")}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
        required
      />

      <input
        name="lastName"
        type="text"
        placeholder={t("lastName")}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
        required
      />

      <input
        name="username"
        type="text"
        placeholder={t("username")}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
        required
      />

      <input
        name="email"
        type="email"
        placeholder={t("email")}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
        required
      />

      <PasswordInput
        name="password"
        placeholder={t("password")}
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
        required
        aria-describedby="password-rules"
      />

      <div id="password-rules">
        <PasswordRulesChecklist password={password} />
      </div>

      <PasswordInput
        name="confirmPassword"
        placeholder={t("confirmPassword")}
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
        required
      />

      {confirmPassword.length > 0 && !passwordsMatch && (
        <p className="text-sm text-red-600">{t("passwordMismatch")}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-[#1f7a45] py-3 font-semibold text-white transition hover:bg-[#19653a] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
      >
        {t("submit")}
      </button>
    </form>
  );
}
