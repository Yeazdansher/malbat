import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import SessionActivityGuard from "@/components/SessionActivityGuard";
import { PERSIST_COOKIE } from "@/lib/auth/session-policy";
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

  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${malbatDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionActivityGuard enabled={trackIdle} />
        {children}
      </body>
    </html>
  );
}
