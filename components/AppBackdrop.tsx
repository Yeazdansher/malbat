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
          className={
            muted
              ? "absolute inset-0 bg-[#0c1a12]/60"
              : "absolute inset-0 bg-[#0c1a12]/50"
          }
        />
        <div
          className={
            muted
              ? "absolute inset-0 bg-gradient-to-b from-[#0c1a12]/55 via-[#0c1a12]/35 to-[#0c1a12]/75"
              : "absolute inset-0 bg-gradient-to-b from-[#0c1a12]/45 via-[#0c1a12]/25 to-[#0c1a12]/65"
          }
        />
      </div>
      {children}
    </div>
  );
}
