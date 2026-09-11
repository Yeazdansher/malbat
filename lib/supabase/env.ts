function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getSupabaseEnv(): { url: string; key: string } {
  const url = stripWrappingQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = stripWrappingQuotes(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
  );

  if (!url || !key) {
    throw new Error(
      "MISSING_SUPABASE_ENV: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY müssen in Vercel (Production) gesetzt und danach neu deployed werden."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "INVALID_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL ist ungültig. Erwartet z. B. https://xxxx.supabase.co — ohne Anführungszeichen, ohne Slash am Ende."
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      "INVALID_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL muss mit https:// beginnen."
    );
  }

  return { url: parsed.origin, key };
}

export function getSiteUrl(): string {
  const siteUrl = stripWrappingQuotes(
    process.env.NEXT_PUBLIC_SITE_URL ?? ""
  ).replace(/\/$/, "");

  if (siteUrl) {
    return siteUrl;
  }

  return "http://localhost:3000";
}
