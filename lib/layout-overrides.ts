import type { TreeLayout } from "@/lib/tree-engine/types";

export type LayoutOverride = {
  x: number;
  y: number;
};

export type LayoutOverrideMap = Record<string, LayoutOverride>;

export function applyLayoutOverrides(
  layout: TreeLayout,
  overrides: LayoutOverrideMap
): TreeLayout {
  if (Object.keys(overrides).length === 0) {
    return layout;
  }

  return {
    nodes: layout.nodes.map((node) => {
      const override = overrides[node.id];
      if (!override) {
        return node;
      }

      return {
        ...node,
        position: { x: override.x, y: override.y },
      };
    }),
    edges: layout.edges,
  };
}

export function overridesFromPositions(
  positions: { nodeId: string; x: number; y: number }[]
): LayoutOverrideMap {
  return Object.fromEntries(
    positions.map((entry) => [entry.nodeId, { x: entry.x, y: entry.y }])
  );
}
