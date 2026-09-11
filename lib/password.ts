export const PASSWORD_REQUIREMENTS =
  "Mindestens 8 Zeichen, ein Großbuchstabe, ein Kleinbuchstabe, eine Zahl und ein Sonderzeichen.";

export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "Mindestens 8 Zeichen",
    test: (password) => password.length >= 8,
  },
  {
    id: "upper",
    label: "Mindestens ein Großbuchstabe",
    test: (password) => /\p{Lu}/u.test(password),
  },
  {
    id: "lower",
    label: "Mindestens ein Kleinbuchstabe",
    test: (password) => /\p{Ll}/u.test(password),
  },
  {
    id: "number",
    label: "Mindestens eine Zahl",
    test: (password) => /\p{N}/u.test(password),
  },
  {
    id: "special",
    label: "Mindestens ein Sonderzeichen",
    test: (password) => /[^\p{L}\p{N}\s]/u.test(password),
  },
];

export function getPasswordRuleResults(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));
}

export function isValidPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
