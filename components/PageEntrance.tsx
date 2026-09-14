"use client";

import { useEffect, useState, type ReactNode } from "react";

type PageEntranceProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

/**
 * Ruhige Einstiegsphase, danach weiches Einblenden des Seiteninhalts.
 */
export default function PageEntrance({
  eyebrow,
  title,
  children,
}: PageEntranceProps) {
  const [introMounted, setIntroMounted] = useState(true);
  const [introShown, setIntroShown] = useState(false);
  const [contentShown, setContentShown] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIntroShown(true);
    });

    const startContent = window.setTimeout(() => {
      setIntroShown(false);
      setContentShown(true);
    }, 1200);

    const unmountIntro = window.setTimeout(() => {
      setIntroMounted(false);
    }, 1900);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(startContent);
      window.clearTimeout(unmountIntro);
    };
  }, []);

  return (
    <>
      {introMounted && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center bg-[#0c1a12]/40 transition-opacity duration-700 ${
            introShown ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!introShown}
        >
          <div
            className={`px-6 text-center transition-all duration-700 ${
              introShown
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
        className={`transition-all duration-[850ms] ease-out ${
          contentShown
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}
