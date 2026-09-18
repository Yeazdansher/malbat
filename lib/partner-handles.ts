import type { Edge, Node } from "@xyflow/react";

const CARD_HEIGHT = 176;
const FAMILY_NODE_SIZE = 32;

/**
 * Partner-Handles anhand der aktuellen Node-Positionen neu setzen,
 * damit nach dem Verschieben die richtige Seite (links/rechts) genutzt wird.
 */
export function recomputePartnerHandles(
  nodes: Node[],
  edges: Edge[]
): Edge[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) {
      return edge;
    }

    const sourceIsPerson = source.type === "person";
    const targetIsFamily = target.type === "family";
    const sourceIsFamily = source.type === "family";
    const targetIsPerson = target.type === "person";

    if (sourceIsPerson && targetIsFamily) {
      const personOnLeft = source.position.x < target.position.x;
      const personCy = source.position.y + CARD_HEIGHT / 2;
      const familyCy = target.position.y + FAMILY_NODE_SIZE / 2;
      const routing =
        familyCy < personCy - 20
          ? "partner-bridge"
          : ((edge.data as { routing?: string } | undefined)?.routing ??
            "default");

      return {
        ...edge,
        sourceHandle: personOnLeft ? "partner-right" : "partner-left",
        targetHandle: personOnLeft ? "left" : "right",
        data: {
          ...((edge.data as object) ?? {}),
          routing:
            routing === "sibling-bus" ? "sibling-bus" : routing,
        },
      };
    }

    if (sourceIsFamily && targetIsPerson) {
      return {
        ...edge,
        sourceHandle: "children",
        targetHandle: "parent",
      };
    }

    if (sourceIsFamily && target.type === "family") {
      return {
        ...edge,
        sourceHandle: "children",
        targetHandle: "parents",
      };
    }

    return edge;
  });
}
