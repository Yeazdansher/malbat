import type { ReactNode } from "react";

type BrandMarkProps = {
  className?: string;
  as?: "p" | "span" | "h1" | "div";
  /** Optional Icon zwischen MAL und BAT */
  icon?: ReactNode;
};

/**
 * Einheitliche MALBAT-Wortmarke (Fraunces wie auf der Startseite).
 * Mit `icon`: MAL[Icon]BAT
 */
export default function BrandMark({
  className = "",
  as: Tag = "span",
  icon,
}: BrandMarkProps) {
  const shared = {
    className: `font-bold tracking-[0.06em] ${className}`,
    style: { fontFamily: "var(--font-malbat), serif" } as const,
  };

  if (!icon) {
    return <Tag {...shared}>MALBAT</Tag>;
  }

  return (
    <Tag
      {...shared}
      className={`inline-flex items-center gap-1.5 font-bold tracking-[0.06em] sm:gap-2 ${className}`}
      aria-label="MALBAT"
    >
      <span>MAL</span>
      <span className="inline-flex shrink-0 items-center">{icon}</span>
      <span>BAT</span>
    </Tag>
  );
}
