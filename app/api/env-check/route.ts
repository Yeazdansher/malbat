import { NextResponse } from "next/server";

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

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const rawSite = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const url = stripWrappingQuotes(rawUrl);
  const key = stripWrappingQuotes(rawKey);
  const site = stripWrappingQuotes(rawSite);

  let urlHost: string | null = null;
  let urlValid = false;
  let urlError: string | null = null;

  try {
    const parsed = new URL(url);
    urlValid = parsed.protocol === "http:" || parsed.protocol === "https:";
    urlHost = urlValid ? parsed.host : null;
    if (!urlValid) {
      urlError = "protocol";
    }
  } catch {
    urlError = "parse";
  }

  return NextResponse.json({
    supabaseUrl: {
      present: rawUrl.length > 0,
      length: rawUrl.length,
      startsWithHttps: url.toLowerCase().startsWith("https://"),
      hasQuotes: rawUrl.trim().startsWith('"') || rawUrl.trim().startsWith("'"),
      hasWhitespace: rawUrl !== rawUrl.trim(),
      valid: urlValid,
      host: urlHost,
      error: urlError,
    },
    supabaseKey: {
      present: rawKey.length > 0,
      length: rawKey.length,
      prefix: key.slice(0, 3),
    },
    siteUrl: {
      present: rawSite.length > 0,
      value: site || null,
    },
  });
}
