/**
 * Knoten, die beim Ziehen einer Person mitbewegt werden:
 * die Person, alle Nachkommen und verbundene Familienknoten.
 */

type Rel = {
  person1_id: string;
  person2_id: string;
  relationship_type: string;
};

type LayoutEdge = {
  source: string;
  target: string;
};

const PARENT_TYPES = new Set([
  "father",
  "mother",
  "parent",
  "adoptive-parent",
]);

function collectDescendants(
  rootPersonId: string,
  relationships: Rel[]
): Set<string> {
  const descendants = new Set<string>();
  const queue = [rootPersonId];

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (descendants.has(current)) {
      continue;
    }

    descendants.add(current);

    for (const relation of relationships) {
      if (
        PARENT_TYPES.has(relation.relationship_type) &&
        relation.person1_id === current
      ) {
        queue.push(relation.person2_id);
      }
    }
  }

  return descendants;
}

export function collectDragGroupNodeIds(
  rootPersonId: string,
  relationships: Rel[],
  layoutEdges: LayoutEdge[]
): Set<string> {
  const nodeIds = collectDescendants(rootPersonId, relationships);
  let changed = true;

  while (changed) {
    changed = false;

    for (const edge of layoutEdges) {
      const { source, target } = edge;
      const sourceIn = nodeIds.has(source);
      const targetIn = nodeIds.has(target);

      if (sourceIn && !targetIn && target.startsWith("family-node:")) {
        nodeIds.add(target);
        changed = true;
      }

      if (targetIn && !sourceIn && source.startsWith("family-node:")) {
        nodeIds.add(source);
        changed = true;
      }

      if (
        source.startsWith("family-node:") &&
        sourceIn &&
        !targetIn &&
        !target.startsWith("family-node:")
      ) {
        nodeIds.add(target);
        changed = true;
      }

      if (
        target.startsWith("family-node:") &&
        targetIn &&
        !sourceIn &&
        !source.startsWith("family-node:")
      ) {
        nodeIds.add(source);
        changed = true;
      }
    }
  }

  return nodeIds;
}
