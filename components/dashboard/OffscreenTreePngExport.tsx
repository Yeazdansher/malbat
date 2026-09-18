"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import TreeView, {
  type TreeViewHandle,
} from "@/components/family/TreeView";
import {
  loadFamilyTreeSnapshot,
  type FamilyTreeSnapshot,
} from "@/app/dashboard/export-tree-actions";

type Props = {
  familyId: string;
  onDone: (result: { ok: true } | { ok: false; error: string }) => void;
};

/**
 * Rendert den Stammbaum unsichtbar, erzeugt das PNG und räumt wieder auf.
 * Navigiert nicht zur Family-Seite.
 */
export default function OffscreenTreePngExport({ familyId, onDone }: Props) {
  const treeRef = useRef<TreeViewHandle>(null);
  const [snapshot, setSnapshot] = useState<FamilyTreeSnapshot | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await loadFamilyTreeSnapshot(familyId);
      if (cancelled) return;

      if (!result.ok) {
        onDone({ ok: false, error: result.error });
        return;
      }

      if (result.data.persons.length === 0) {
        onDone({ ok: false, error: "EMPTY_TREE" });
        return;
      }

      setSnapshot(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [familyId, onDone]);

  useEffect(() => {
    if (!snapshot || startedRef.current) {
      return;
    }

    startedRef.current = true;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await treeRef.current?.exportPng();
          if (!cancelled) {
            onDone({ ok: true });
          }
        } catch (error) {
          console.error("Offscreen PNG export:", error);
          if (!cancelled) {
            onDone({
              ok: false,
              error:
                error instanceof Error ? error.message : "EXPORT_FAILED",
            });
          }
        }
      })();
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [snapshot, onDone]);

  if (!snapshot || typeof document === "undefined") {
    return null;
  }

  const noopPerson = () => undefined;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed"
      style={{
        left: -12000,
        top: 0,
        width: 1400,
        height: 1000,
        overflow: "hidden",
      }}
    >
      <div className="h-full w-full" dir="ltr">
        <TreeView
          ref={treeRef}
          familyName={snapshot.familyName}
          persons={snapshot.persons}
          relationships={snapshot.relationships}
          layoutOverrides={snapshot.layoutOverrides}
          canEdit={false}
          arrangeMode={false}
          discardGeneration={0}
          focusRequest={0}
          onArrangePositionsChange={() => undefined}
          onArrangeDirtyChange={() => undefined}
          onOpenDetails={noopPerson}
          onOpenRelationship={noopPerson}
          onOpenParents={noopPerson}
          onOpenSiblings={noopPerson}
          onAddChild={() => undefined}
          onFocusPerson={() => undefined}
        />
      </div>
    </div>,
    document.body
  );
}
