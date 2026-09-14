import Link from "next/link";

import AuthShell from "@/components/landing/AuthShell";
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
    <AuthShell
      title="Passwort vergessen"
      subtitle="Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, mit dem du ein neues Passwort festlegen kannst."
    >
      {sent === "1" && (
        <p className="mt-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link
          zum Zurücksetzen des Passworts versendet.
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
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#1f7a45] focus:outline-none"
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#1f7a45] py-3 font-semibold text-white transition hover:bg-[#19653a]"
        >
          Link anfordern
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 block text-center text-sm text-[#1f7a45] hover:underline"
      >
        ← Zur Anmeldung
      </Link>
    </AuthShell>
  );
}
