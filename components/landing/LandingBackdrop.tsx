"use client";

import Image from "next/image";
import { Source_Sans_3 } from "next/font/google";
import { useEffect, useState, type ReactNode } from "react";

import BrandMark from "@/components/BrandMark";

const landingBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-body",
});

type LandingBackdropProps = {
  children: ReactNode;
  animateImage?: boolean;
};

export default function LandingBackdrop({
  children,
  animateImage = true,
}: LandingBackdropProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`${landingBody.variable} relative min-h-screen overflow-hidden bg-[#0c1a12] text-white`}
      style={{ fontFamily: "var(--font-landing-body), sans-serif" }}
    >
      <div
        className={`absolute inset-0 ${
          animateImage
            ? `transition-transform duration-[12s] ease-out ${
                ready ? "scale-105" : "scale-100"
              }`
            : ""
        }`}
      >
        <Image
          src="/landing/hero.jpg"
          alt="Mehrgenerationenfamilie unter einem Baum im Abendlicht"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a12]/92 via-[#0c1a12]/70 to-[#0c1a12]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a12]/85 via-transparent to-[#0c1a12]/40" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function LandingBrand({
  size = "md",
  className = "",
}: {
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <BrandMark
      as="p"
      className={
        size === "lg"
          ? `text-6xl tracking-[0.08em] text-[#d8f0e0] sm:text-7xl lg:text-8xl ${className}`
          : `text-4xl text-[#1f7a45] ${className}`
      }
    />
  );
}
