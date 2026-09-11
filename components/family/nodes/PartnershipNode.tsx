"use client";

import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

/**
 * Familienknoten zwischen Partnern.
 * Klick öffnet das Anlegen eines gemeinsamen Kindes.
 */
export default function PartnershipNode(props: NodeProps) {
  const canEdit = (props.data as { canEdit?: boolean }).canEdit ?? true;

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

      <div
        className={
          canEdit
            ? "flex h-8 w-8 items-center justify-center rounded-full border bg-white text-base leading-none shadow-sm"
            : "h-2 w-2 rounded-full bg-gray-400"
        }
        title={canEdit ? "Kind hinzufügen" : undefined}
        aria-label={canEdit ? "Kind hinzufügen" : undefined}
      >
        {canEdit ? "👶" : null}
      </div>
    </div>
  );
}
