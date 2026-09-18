/**
 * Knoten, die beim Ziehen einer Person mitbewegt werden:
 * die Person, Partner ihrer Ehen, Nachkommen und verbundene Familienknoten.
 * Vorfahren bleiben unberührt.
 */

import { buildTreeGraph } from "@/lib/tree-engine/graph";
import type { Relationship } from "@/lib/tree-engine/types";
import { collectSearchBranch } from "@/lib/search-branch";

export function collectDragGroupNodeIds(
  rootPersonId: string,
  relationships: Relationship[]
): Set<string> {
  const graph = buildTreeGraph([], relationships);
  const branch = collectSearchBranch(rootPersonId, relationships);

  const nodeIds = new Set<string>([
    rootPersonId,
    ...branch.descendants,
    ...branch.descendantFamilyIds,
  ]);

  // Partner und Family-Knoten der Ehen der gezogenen Person.
  for (const family of graph.families.values()) {
    if (family.kind === "sibling-group") {
      continue;
    }
    if (!family.partners.includes(rootPersonId)) {
      continue;
    }

    nodeIds.add(family.familyNodeId);
    for (const partnerId of family.partners) {
      nodeIds.add(partnerId);
    }
  }

  // Family-Knoten und Partner der Nachkommen-Ehen.
  for (const family of graph.families.values()) {
    if (family.kind === "sibling-group") {
      continue;
    }

    const touchesGroup =
      family.partners.some((id) => nodeIds.has(id)) ||
      family.children.some((id) => nodeIds.has(id));

    if (!touchesGroup) {
      continue;
    }

    // Nur nach unten: Family-Knoten, deren Partner schon in der Gruppe sind
    // (Nachkommen-Ehen), nicht Herkunft der Vorfahren.
    const partnerInGroup = family.partners.some((id) => nodeIds.has(id));
    if (!partnerInGroup) {
      continue;
    }

    nodeIds.add(family.familyNodeId);
    for (const partnerId of family.partners) {
      nodeIds.add(partnerId);
    }
    for (const childId of family.children) {
      if (branch.descendants.has(childId) || childId === rootPersonId) {
        nodeIds.add(childId);
      }
    }
  }

  return nodeIds;
}
