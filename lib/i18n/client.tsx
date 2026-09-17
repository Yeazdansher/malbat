"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { Locale } from "@/lib/i18n/config";
import { translate, type Messages } from "@/lib/i18n/get-messages";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
};

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nProviderProps) {
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      translate(messages, key, values),
    [messages]
  );

  const value = useMemo(
    () => ({ locale, messages, t }),
    [locale, messages, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useTranslations(namespace?: string) {
  const { t } = useI18n();
  return useCallback(
    (key: string, values?: Record<string, string | number>) =>
      t(namespace ? `${namespace}.${key}` : key, values),
    [namespace, t]
  );
}
