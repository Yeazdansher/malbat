import Link from "next/link";
import { redirect } from "next/navigation";

import { PasswordInput } from "@/components/PasswordInput";
import AuthShell from "@/components/landing/AuthShell";
import { PASSWORD_REQUIREMENTS } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

import { resetPassword } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an."
      )}`
    );
  }

  return (
    <AuthShell
      title="Neues Passwort festlegen"
      subtitle={PASSWORD_REQUIREMENTS}
    >
      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={resetPassword} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="mb-2 block font-medium">
            Neues Passwort
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
            required
            autoFocus
          />
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
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#1f7a45] py-3 font-semibold text-white transition hover:bg-[#19653a]"
        >
          Passwort speichern
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 block text-center text-sm text-[#1f7a45] hover:underline"
      >
        Zur Anmeldung
      </Link>
    </AuthShell>
  );
}
