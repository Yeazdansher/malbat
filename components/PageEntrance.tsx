"use client";

import { useEffect, useState, type ReactNode } from "react";

type PageEntranceProps = {
  eyebrow: string;
  title: string;
  /** Stable key: intro only once per family per browser session */
  storageKey?: string;
  children: ReactNode;
};

/**
 * 1) Erstes Oeffnen: Name-Animation, dann Inhalt.
 * 2) Spaeter in derselben Session (auch nach Soft-Refresh): sofort Inhalt, keine Animation.
 */
export default function PageEntrance({
  eyebrow,
  title,
  storageKey,
  children,
}: PageEntranceProps) {
  const key = storageKey ? `malbat-entrance:${storageKey}` : null;

  const [mode, setMode] = useState<"loading" | "intro" | "ready">("loading");
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
    const alreadySeen = key ? sessionStorage.getItem(key) === "1" : false;

    if (alreadySeen) {
      setMode("ready");
      return;
    }

    // Sofort merken, damit Soft-Refresh waehrend/nach der Animation nicht erneut startet.
    if (key) {
      sessionStorage.setItem(key, "1");
    }

    setMode("intro");

    const show = window.requestAnimationFrame(() => {
      setIntroVisible(true);
    });

    const reveal = window.setTimeout(() => {
      setIntroVisible(false);
      setMode("ready");
    }, 1400);

    return () => {
      window.cancelAnimationFrame(show);
      window.clearTimeout(reveal);
    };
  }, [key]);

  if (mode === "loading") {
    // Kurzer Platzhalter ohne Inhalt-Flash; Intro folgt im naechsten Tick.
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0c1a12]/40">
        <div className="px-6 text-center">
          <p className="text-sm tracking-[0.22em] text-white/70 uppercase">
            {eyebrow}
          </p>
          <h1
            className="mt-4 text-4xl font-semibold text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-malbat), serif" }}
          >
            {title}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <>
      {mode === "intro" && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center bg-[#0c1a12]/40 transition-opacity duration-700 ${
            introVisible ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!introVisible}
        >
          <div
            className={`px-6 text-center transition-all duration-700 ${
              introVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.98] opacity-0"
            }`}
          >
            <p className="text-sm tracking-[0.22em] text-white/70 uppercase">
              {eyebrow}
            </p>
            <h1
              className="mt-4 text-4xl font-semibold text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-malbat), serif" }}
            >
              {title}
            </h1>
          </div>
        </div>
      )}

      <div
        className={
          mode === "ready"
            ? "opacity-100 transition-opacity duration-500"
            : "pointer-events-none opacity-0"
        }
      >
        {children}
      </div>
    </>
  );
}
