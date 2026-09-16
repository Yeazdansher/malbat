"use client";

import { useEffect, useState, type ReactNode } from "react";

import { consumeSkipFamilyEntrance } from "@/lib/family-entrance";

type PageEntranceProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

/**
 * Uebergang beim Oeffnen des Stammbaums (z. B. vom Dashboard).
 * Soft-Refresh bei Personen-Aenderungen ueberspringt die Animation.
 */
export default function PageEntrance({
  eyebrow,
  title,
  children,
}: PageEntranceProps) {
  const [mode, setMode] = useState<"loading" | "intro" | "ready">("loading");
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
    if (consumeSkipFamilyEntrance()) {
      setMode("ready");
      return;
    }

    setMode("intro");

    const show = window.requestAnimationFrame(() => {
      setIntroVisible(true);
    });

    const reveal = window.setTimeout(() => {
      setIntroVisible(false);
    }, 1100);

    const ready = window.setTimeout(() => {
      setMode("ready");
    }, 1600);

    return () => {
      window.cancelAnimationFrame(show);
      window.clearTimeout(reveal);
      window.clearTimeout(ready);
    };
  }, []);

  if (mode === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0c1a12]">
        <div className="px-6 text-center opacity-0">
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
          className={`fixed inset-0 z-40 flex items-center justify-center bg-[#0c1a12] transition-opacity duration-700 ${
            introVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`px-6 text-center transition-all duration-700 ease-out ${
              introVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-3 scale-95 opacity-0"
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
