"use client";

import type { ReactNode } from "react";

import LandingBackdrop, { LandingBrand } from "./LandingBackdrop";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <LandingBackdrop animateImage>
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/95 p-8 text-gray-900 shadow-2xl backdrop-blur-md">
          <div className="text-center">
            <LandingBrand size="md" />
            <h1
              className="mt-5 text-2xl font-semibold text-gray-900"
              style={{ fontFamily: "var(--font-malbat), serif" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-gray-600">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </main>
    </LandingBackdrop>
  );
}
