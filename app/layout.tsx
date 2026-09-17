import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";

import SessionActivityGuard from "@/components/SessionActivityGuard";
import { PERSIST_COOKIE } from "@/lib/auth/session-policy";
import { I18nProvider } from "@/lib/i18n/client";
import { dirForLocale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessages } from "@/lib/i18n/get-messages";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const malbatDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-malbat",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "MALBAT",
  description: "Familienstammbäume gemeinsam erstellen und verwalten.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const trackIdle = cookieStore.get(PERSIST_COOKIE)?.value === "0";
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const dir = dirForLocale(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${malbatDisplay.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={
          locale === "ar"
            ? { fontFamily: "var(--font-arabic), sans-serif" }
            : undefined
        }
      >
        <I18nProvider locale={locale} messages={messages}>
          <SessionActivityGuard enabled={trackIdle} />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
