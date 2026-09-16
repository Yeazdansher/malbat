"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { skipFamilyEntranceOnce } from "@/lib/family-entrance";

/** Soft-Refresh im Stammbaum ohne Entrance-Animation. */
export function useTreeRefresh() {
  const router = useRouter();

  return useCallback(() => {
    skipFamilyEntranceOnce();
    router.refresh();
  }, [router]);
}
