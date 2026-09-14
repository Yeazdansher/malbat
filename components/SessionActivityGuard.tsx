"use client";

import { useEffect, useEffectEvent } from "react";

import {
  IDLE_TIMEOUT_MS,
  LAST_ACTIVE_COOKIE,
} from "@/lib/auth/session-policy";
import { logout } from "@/app/logout/actions";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeLastActive(timestamp: number) {
  const maxAge = Math.ceil(IDLE_TIMEOUT_MS / 1000) + 60;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LAST_ACTIVE_COOKIE}=${timestamp}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

type Props = {
  enabled: boolean;
};

/**
 * When "Angemeldet bleiben" is off: refresh last-active on user activity
 * and sign out after one idle hour.
 */
export default function SessionActivityGuard({ enabled }: Props) {
  const onActivity = useEffectEvent(() => {
    writeLastActive(Date.now());
  });

  const checkIdle = useEffectEvent(() => {
    const raw = readCookie(LAST_ACTIVE_COOKIE);
    if (!raw) {
      writeLastActive(Date.now());
      return;
    }
    const last = Number(raw);
    if (!Number.isFinite(last)) {
      writeLastActive(Date.now());
      return;
    }
    if (Date.now() - last >= IDLE_TIMEOUT_MS) {
      void logout();
    }
  });

  useEffect(() => {
    if (!enabled) return;

    writeLastActive(Date.now());

    const windowEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    let throttleUntil = 0;
    const handler = () => {
      const now = Date.now();
      if (now < throttleUntil) return;
      throttleUntil = now + 15_000;
      onActivity();
    };

    for (const event of windowEvents) {
      window.addEventListener(event, handler, { passive: true });
    }
    document.addEventListener("visibilitychange", handler, {
      passive: true,
    });

    const interval = window.setInterval(() => {
      checkIdle();
    }, 30_000);

    checkIdle();

    return () => {
      for (const event of windowEvents) {
        window.removeEventListener(event, handler);
      }
      document.removeEventListener("visibilitychange", handler);
      window.clearInterval(interval);
    };
  }, [enabled]);

  return null;
}
