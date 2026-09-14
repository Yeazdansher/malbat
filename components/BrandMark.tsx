type BrandMarkProps = {
  className?: string;
  as?: "p" | "span" | "h1" | "div";
};

/**
 * Einheitliche MALBAT-Wortmarke (Fraunces wie auf der Startseite).
 */
export default function BrandMark({
  className = "",
  as: Tag = "span",
}: BrandMarkProps) {
  return (
    <Tag
      className={`font-bold tracking-[0.06em] ${className}`}
      style={{ fontFamily: "var(--font-malbat), serif" }}
    >
      MALBAT
    </Tag>
  );
}
