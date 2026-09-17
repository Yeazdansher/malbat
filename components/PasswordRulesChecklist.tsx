"use client";

import { useTranslations } from "@/lib/i18n/client";
import { getPasswordRuleResults } from "@/lib/password";

type Props = {
  password: string;
};

const RULE_KEYS: Record<string, string> = {
  length: "ruleLength",
  upper: "ruleUpper",
  lower: "ruleLower",
  number: "ruleNumber",
  special: "ruleSpecial",
};

export function PasswordRulesChecklist({ password }: Props) {
  const t = useTranslations("password");
  const rules = getPasswordRuleResults(password);
  const started = password.length > 0;

  return (
    <ul className="space-y-1.5 text-sm" aria-live="polite">
      {rules.map((rule) => {
        const met = rule.met;
        const color = !started
          ? "text-gray-500"
          : met
            ? "text-green-700"
            : "text-gray-500";
        const labelKey = RULE_KEYS[rule.id] ?? rule.id;

        return (
          <li key={rule.id} className={`flex items-start gap-2 ${color}`}>
            <span
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              {started && met ? (
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
              )}
            </span>
            <span>{t(labelKey)}</span>
          </li>
        );
      })}
    </ul>
  );
}
