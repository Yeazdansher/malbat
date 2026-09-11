"use client";

import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  className?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.7 11.7 0 0 1-1.7 2.9" />
        <path d="M6.1 6.1A11.8 11.8 0 0 0 1 12.5C2.7 16.9 7 20 12 20a10.4 10.4 0 0 0 4.2-.9" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12.5C3.7 8.1 8 5 13 5s9.3 3.1 11 7.5C20.3 16.9 16 20 11 20S1.7 16.9 0 12.5" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}

export function PasswordInput({
  className = "w-full rounded-lg border p-3",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
        aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
        title={visible ? "Passwort verbergen" : "Passwort anzeigen"}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}
