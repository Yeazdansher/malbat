"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type AppBackdropProps = {
  children: ReactNode;
  /** Default: landing hero. Use a calmer image on focus-heavy pages. */
  imageSrc?: string;
  /** Stronger dimming for less visual noise behind content */
  muted?: boolean;
};

/**
 * Gemeinsamer Hintergrund für eingeloggte App-Seiten.
 */
export default function AppBackdrop({
  children,
  imageSrc = "/landing/hero.jpg",
  muted = false,
}: AppBackdropProps) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[#0c1a12]"
          style={{
            opacity: muted
              ? "var(--backdrop-dim-muted)"
              : "var(--backdrop-dim)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: muted
              ? `linear-gradient(to bottom, rgb(12 26 18 / var(--backdrop-top-muted)), rgb(12 26 18 / var(--backdrop-mid-muted)), rgb(12 26 18 / var(--backdrop-bottom-muted)))`
              : `linear-gradient(to bottom, rgb(12 26 18 / var(--backdrop-top)), rgb(12 26 18 / var(--backdrop-mid)), rgb(12 26 18 / var(--backdrop-bottom)))`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
