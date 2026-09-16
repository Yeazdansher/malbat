import type { Edge, Node } from "@xyflow/react";

import type {
  TreeGraph,
  TreeLayout,
  PersonLayoutNode,
  FamilyLayoutNode,
  Person,
} from "./types";

const CARD_HEIGHT = 176;
const CARD_WIDTH = 270;
const FAMILY_NODE_SIZE = 32;

/**
 * Erzeugt ausschließlich React-Flow-Nodes und -Edges.
 *
 * Der Renderer enthält bewusst keinerlei Logik zur
 * Positionierung oder Berechnung des Stammbaums.
 *
 * Alle Koordinaten stammen ausschließlich aus dem
 * TreeLayout.
 */
export function buildReactFlowGraph(
  graph: TreeGraph,
  layout: TreeLayout,
  onOpenDetails: (person: Person) => void,
  onOpenRelationship: (person: Person) => void,
  onOpenParents: (person: Person) => void,
  onOpenSiblings: (person: Person) => void,
  canEdit: boolean
): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];

  /**
   * ----------------------------------------
   * Nodes
   * ----------------------------------------
   */

  for (const node of layout.nodes) {
    if (node.type === "person") {
      const personNode = node as PersonLayoutNode;

      const person = graph.persons.get(personNode.id);

      if (!person) {
        continue;
      }

      const hasParents = graph.relationships.some(
        (relation) =>
          relation.person2_id === person.id &&
          (relation.relationship_type === "father" ||
            relation.relationship_type === "mother" ||
            relation.relationship_type === "parent" ||
            relation.relationship_type === "adoptive-parent")
      );

      nodes.push({
        id: person.id,
        type: "person",

        position: personNode.position,
        width: 270,
        height: 176,

        data: {
          person,
          hasParents,
          canEdit,

          onOpenDetails: () => onOpenDetails(person),

          onOpenRelationship: () =>
            onOpenRelationship(person),

          onOpenParents: () => onOpenParents(person),
          onOpenSiblings: () => onOpenSiblings(person),
        },
      });

      continue;
    }

    const familyNode = node as FamilyLayoutNode;

    const family = graph.families.get(familyNode.familyId);

    nodes.push({
      id: familyNode.id,

      type: "family",

      position: familyNode.position,
      width: 32,
      height: 32,
      zIndex: 1000,

      style: {
        width: 32,
        height: 32,
        zIndex: 1000,
      },

      draggable: false,
      selectable: true,
      className: "nodrag nopan",

      data: {
        parentIds: family?.partners ?? [],
        canEdit,
        kind: family?.kind ?? "union",
      },
    });
  }

  /**
   * ----------------------------------------
   * Edges
   * ----------------------------------------
   *
   * Der Renderer verwendet ausschließlich
   * die bereits vorbereiteten Layout-Kanten.
   */

  const layoutById = new Map(
    layout.nodes.map((node) => [node.id, node])
  );

  const edges: Edge[] = layout.edges.map((edge) => {
    const sourceLayout = layoutById.get(edge.source);
    const targetLayout = layoutById.get(edge.target);

    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;
    let routing = "default";

    if (
      sourceLayout?.type === "person" &&
      targetLayout?.type === "family"
    ) {
      const personOnLeft =
        sourceLayout.position.x < targetLayout.position.x;

      sourceHandle = personOnLeft
        ? "partner-right"
        : "partner-left";

      targetHandle = personOnLeft ? "left" : "right";

      // Family-Knoten deutlich über der Person → Bogen über dazwischenliegende Partner.
      const personCy = sourceLayout.position.y + CARD_HEIGHT / 2;
      const familyCy = targetLayout.position.y + FAMILY_NODE_SIZE / 2;
      if (familyCy < personCy - 20) {
        routing = "partner-bridge";
      }
    }

    const sourceFamily =
      sourceLayout?.type === "family"
        ? graph.families.get(
            (sourceLayout as FamilyLayoutNode).familyId
          )
        : undefined;

    if (
      sourceLayout?.type === "family" &&
      targetLayout?.type === "person"
    ) {
      sourceHandle = "children";
      targetHandle = "parent";

      // Kind weit seitlich (Cousinen-Ehe): Schiene über den Karten, nicht durch sie.
      const sourceCx = sourceLayout.position.x + FAMILY_NODE_SIZE / 2;
      const targetCx = targetLayout.position.x + CARD_WIDTH / 2;
      if (Math.abs(targetCx - sourceCx) > CARD_WIDTH) {
        routing = "parent-bridge";
      }
    }

    if (
      sourceLayout?.type === "family" &&
      targetLayout?.type === "family"
    ) {
      sourceHandle = "children";
      targetHandle = "parents";
    }

    if (sourceFamily?.kind === "sibling-group") {
      routing = "sibling-bus";
    }

    return {
      id: `${edge.source}-${edge.target}`,

      source: edge.source,
      target: edge.target,

      sourceHandle,
      targetHandle,

      type: "family",

      selectable: false,
      focusable: false,

      animated: false,

      data: {
        routing,
      },

      style: {
        stroke: "#1f2937",
        strokeWidth: 2.5,
      },
    };
  });

  return {
    nodes,
    edges,
  };
}