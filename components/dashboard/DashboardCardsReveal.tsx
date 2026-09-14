"use client";

import { useEffect, useState, type ReactNode } from "react";

type DashboardCardsRevealProps = {
  children: ReactNode[];
};

/**
 * Dashboard ohne Intro: Karten erscheinen gestaffelt.
 */
export default function DashboardCardsReveal({
  children,
}: DashboardCardsRevealProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-y-6">
      {children.map((child, index) => (
        <div
          key={index}
          className={`transition-all duration-500 ease-out ${
            ready
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: `${120 + index * 110}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
