"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/version";
import LandingBackdrop, { LandingBrand } from "./LandingBackdrop";

export default function LandingHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <LandingBackdrop>
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex flex-1 flex-col justify-center">
          <div
            className={`transition-all duration-700 ${
              ready
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <LandingBrand size="lg" />
          </div>

          <h1
            className={`mt-6 max-w-xl text-2xl font-semibold leading-snug text-white sm:text-3xl transition-all delay-150 duration-700 ${
              ready
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{ fontFamily: "var(--font-malbat), serif" }}
          >
            Der moderne Familienstammbaum
          </h1>

          <p
            className={`mt-4 max-w-md text-lg text-[#d5e6db] transition-all delay-300 duration-700 ${
              ready
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            Familien verbinden · Geschichten bewahren
          </p>

          <div
            className={`mt-10 flex flex-col gap-3 sm:flex-row sm:items-center transition-all delay-500 duration-700 ${
              ready
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <Link
              href="/login"
              className="rounded-xl bg-[#1f7a45] px-7 py-3.5 text-center text-base font-semibold text-white transition hover:bg-[#19653a]"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-white/70 bg-white/10 px-7 py-3.5 text-center text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Registrieren
            </Link>
          </div>
        </div>

        <div className="flex justify-end pt-8 text-sm text-white/55">
          Version v{APP_VERSION}
        </div>
      </main>
    </LandingBackdrop>
  );
}
