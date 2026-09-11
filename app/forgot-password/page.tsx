import Link from "next/link";

import { requestPasswordReset } from "./actions";

type PageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps) {
  const { sent, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-green-700">
          Passwort vergessen
        </h1>

        <p className="mt-4 text-center text-gray-600">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, mit dem
          du ein neues Passwort festlegen kannst.
        </p>

        {sent === "1" && (
          <p className="mt-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein
            Link zum Zurücksetzen des Passworts versendet.
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form action={requestPasswordReset} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border p-3"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-700 py-3 text-white transition hover:bg-green-800"
          >
            Link anfordern
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-green-700 hover:underline"
        >
          ← Zur Anmeldung
        </Link>
      </div>
    </main>
  );
}