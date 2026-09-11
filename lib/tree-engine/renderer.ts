import type { Edge, Node } from "@xyflow/react";

import type {
  TreeGraph,
  TreeLayout,
  PersonLayoutNode,
  FamilyLayoutNode,
  Person,
} from "./types";

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
    }

    if (
      sourceLayout?.type === "family" &&
      targetLayout?.type === "family"
    ) {
      sourceHandle = "children";
      targetHandle = "parents";
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
        routing:
          sourceFamily?.kind === "sibling-group"
            ? "sibling-bus"
            : "default",
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