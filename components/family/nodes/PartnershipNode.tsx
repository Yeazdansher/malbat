"use client";

import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

import { useTranslations } from "@/lib/i18n/client";

/**
 * Familienknoten zwischen Partnern.
 * Klick öffnet das Anlegen eines gemeinsamen Kindes.
 */
export default function PartnershipNode(props: NodeProps) {
  const t = useTranslations("treeExtras");
  const data = props.data as {
    canEdit?: boolean;
    kind?: "union" | "sibling-group";
  };
  const canEdit = data.canEdit ?? true;
  const isSiblingGroup = data.kind === "sibling-group";
  const addChildLabel = t("addChild");
  const siblingsLabel = t("siblings");

  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        id="parents"
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        id="children"
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      {isSiblingGroup ? (
        <div
          className="h-2.5 w-2.5 rounded-full bg-gray-400"
          title={siblingsLabel}
          aria-label={siblingsLabel}
        />
      ) : (
        <div
          className={
            canEdit
              ? "flex h-8 w-8 items-center justify-center rounded-full border bg-white text-base leading-none shadow-sm"
              : "h-2 w-2 rounded-full bg-gray-400"
          }
          title={canEdit ? addChildLabel : undefined}
          aria-label={canEdit ? addChildLabel : undefined}
        >
          {canEdit ? "👶" : null}
        </div>
      )}
    </div>
  );
}
