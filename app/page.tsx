import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-6">
      <div className="-mt-20 max-w-2xl text-center">
        <h1 className="text-7xl font-bold tracking-wide text-green-700">
          MALBAT
        </h1>

        <h2 className="mt-6 text-lg font-medium text-gray-700">
          Der moderne Familienstammbaum
        </h2>

        <p className="mt-2 text-lg font-normal text-gray-500">
          Familien verbinden • Geschichten bewahren
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-green-700 px-6 py-3 text-white transition hover:bg-green-800"
          >
            Anmelden
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-green-700 px-6 py-3 text-green-700 transition hover:bg-green-50"
          >
            Registrieren
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 text-sm text-gray-400">
        Version v{APP_VERSION}
      </div>
    </main>
  );
}