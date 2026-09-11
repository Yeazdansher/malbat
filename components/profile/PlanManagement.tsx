"use client";

import { useState } from "react";

import { activatePremium, downgradeToFree } from "@/app/profile/actions";
import type { PlanUsage } from "@/lib/plans";

type Props = {
  usage: PlanUsage | null;
  error?: string;
};

export default function PlanManagement({ usage, error }: Props) {
  const initialPremium = usage?.planCode === "premium";
  const [premiumOpen, setPremiumOpen] = useState(
    Boolean(error) && !initialPremium
  );
  const [freeOpen, setFreeOpen] = useState(
    Boolean(error) && Boolean(initialPremium)
  );

  if (!usage) {
    return (
      <section id="plan" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900">
          Tarif verwalten
        </h2>
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          Die Tarifdaten konnten nicht geladen werden. Bitte wende dich
          an den Administrator.
        </p>
      </section>
    );
  }

  const premium = usage.planCode === "premium";

  return (
    <section id="plan" className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-gray-900">
        Tarif verwalten
      </h2>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm text-gray-600">Aktueller Tarif</p>
        <p className="mt-1 text-2xl font-bold text-green-700">
          {premium ? "Premium" : "Free"}
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-600">Eigene Stammbäume</dt>
            <dd className="font-semibold">
              {premium
                ? "Unbegrenzt"
                : `${usage.ownedFamiliesCount} von ${usage.maxOwnedFamilies}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">
              Personenlimit je eigenem Stammbaum
            </dt>
            <dd className="font-semibold">
              {premium
                ? "Unbegrenzt"
                : `${usage.ownedPersonsCount} von ${usage.maxPersonsPerOwnedFamily}`}
            </dd>
          </div>
        </dl>

        {premium ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-lg bg-green-100 px-4 py-3 text-green-800">
              Premium ist aktiv.
            </p>
            <button
              type="button"
              onClick={() => setFreeOpen(true)}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-800 hover:bg-white"
            >
              Auf Free wechseln
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPremiumOpen(true)}
            className="mt-6 rounded-lg bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
          >
            Auf Premium upgraden
          </button>
        )}
      </div>

      {premiumOpen && !premium && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activate-premium-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="activate-premium-title"
                  className="text-2xl font-bold text-green-700"
                >
                  Premium
                </h2>
                <p className="mt-1 font-medium text-green-700">
                  Aktuell kostenlos verfügbar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPremiumOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label="Fenster schließen"
              >
                ×
              </button>
            </div>

            <ul className="mt-6 space-y-3 text-gray-700">
              <li>✓ Beliebig viele eigene Stammbäume</li>
              <li>✓ Beliebig viele Personen pro Stammbaum</li>
            </ul>

            <p className="mt-5 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
              Einladungen und die Mitarbeit in fremden Stammbäumen sind
              für Free- und Premium-Konten unbegrenzt.
            </p>

            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </p>
            )}

            <form action={activatePremium} className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPremiumOpen(false)}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
              >
                Premium kostenlos aktivieren
              </button>
            </form>
          </div>
        </div>
      )}

      {freeOpen && premium && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="downgrade-free-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="downgrade-free-title"
                className="text-2xl font-bold text-green-700"
              >
                Auf Free wechseln
              </h2>
              <button
                type="button"
                onClick={() => setFreeOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                aria-label="Fenster schließen"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3 text-gray-700">
              <p>
                Free erlaubt einen eigenen Stammbaum mit maximal 50 Personen.
              </p>
              <p>
                Hast du mehrere eigene Stammbäume, bleibt nur der älteste Baum
                mit höchstens 50 Personen freigeschaltet. Alle weiteren eigenen
                Stammbäume werden gesperrt.
              </p>
              <p>
                Gesperrte Stammbäume und ihre Daten bleiben erhalten. Mit
                Premium kannst du sie jederzeit wieder freischalten.
              </p>
            </div>

            {error && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </p>
            )}

            <form action={downgradeToFree} className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFreeOpen(false)}
                className="rounded-lg border px-5 py-3 hover:bg-gray-100"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-5 py-3 font-medium text-white hover:bg-green-800"
              >
                Auf Free wechseln
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
