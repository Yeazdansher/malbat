import type { TreeGraph, TreeLayout } from "@/lib/tree-engine/types";

export type LayoutOverride = {
  x: number;
  y: number;
};

export type LayoutOverrideMap = Record<string, LayoutOverride>;

const DELTA_EPSILON = 0.5;

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

/**
 * Nach Person-Overrides: Partner, Family-Knoten und direkte Kinder ohne
 * eigenen Override um dasselbe Delta (Override − Auto) der Person verschieben,
 * damit neue Karten an der echten Personenposition landen.
 */
export function reanchorNearbyAfterOverrides(
  layout: TreeLayout,
  autoLayout: TreeLayout,
  overrides: LayoutOverrideMap,
  graph: TreeGraph
): TreeLayout {
  if (Object.keys(overrides).length === 0) {
    return layout;
  }

  const autoById = new Map(
    autoLayout.nodes.map((node) => [node.id, node.position])
  );
  const nodeTypeById = new Map(
    layout.nodes.map((node) => [node.id, node.type])
  );
  const positions = new Map(
    layout.nodes.map((node) => [node.id, { ...node.position }])
  );
  const shifted = new Set<string>();

  function shift(nodeId: string, dx: number, dy: number) {
    if (overrides[nodeId] || shifted.has(nodeId)) {
      return;
    }

    const position = positions.get(nodeId);
    if (!position) {
      return;
    }

    position.x += dx;
    position.y += dy;
    shifted.add(nodeId);
  }

  for (const [personId, override] of Object.entries(overrides)) {
    if (nodeTypeById.get(personId) !== "person") {
      continue;
    }

    const autoPosition = autoById.get(personId);
    if (!autoPosition) {
      continue;
    }

    const dx = override.x - autoPosition.x;
    const dy = override.y - autoPosition.y;
    if (Math.abs(dx) < DELTA_EPSILON && Math.abs(dy) < DELTA_EPSILON) {
      continue;
    }

    for (const family of graph.families.values()) {
      if (family.kind === "sibling-group") {
        continue;
      }
      if (!family.partners.includes(personId)) {
        continue;
      }

      for (const partnerId of family.partners) {
        if (partnerId === personId) {
          continue;
        }
        shift(partnerId, dx, dy);
      }

      shift(family.familyNodeId, dx, dy);

      for (const childId of family.children) {
        shift(childId, dx, dy);
      }
    }
  }

  if (shifted.size === 0) {
    return layout;
  }

  return {
    nodes: layout.nodes.map((node) => {
      const position = positions.get(node.id);
      if (!position) {
        return node;
      }

      return {
        ...node,
        position: { x: position.x, y: position.y },
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
