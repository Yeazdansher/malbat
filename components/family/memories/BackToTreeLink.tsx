"use client";

import Link from "next/link";

import { skipFamilyEntranceOnce } from "@/lib/family-entrance";

type Props = {
  familyId: string;
  label: string;
};

export default function BackToTreeLink({ familyId, label }: Props) {
  return (
    <Link
      href={`/family/${familyId}`}
      onClick={() => skipFamilyEntranceOnce()}
      className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-medium text-[var(--card-text)] hover:bg-[var(--page-bg)]"
    >
      {label}
    </Link>
  );
}
