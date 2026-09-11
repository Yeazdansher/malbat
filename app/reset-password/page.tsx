import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-green-700">
          Neues Passwort festlegen
        </h1>

        <p className="mt-4 text-center text-sm text-gray-600">
          {PASSWORD_REQUIREMENTS}
        </p>

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
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border p-3"
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
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-700 py-3 text-white transition hover:bg-green-800"
          >
            Passwort speichern
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-green-700 hover:underline"
        >
          Zur Anmeldung
        </Link>
      </div>
    </main>
  );
}
