/**
 * Finds father/mother links that siblings are missing compared to each other.
 */

type Rel = {
  person1_id: string;
  person2_id: string;
  relationship_type: string;
};

export function findMissingSiblingParentLinks(
  familyId: string,
  relationships: Rel[]
): Array<{
  family_id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: string;
}> {
  const missing: Array<{
    family_id: string;
    person1_id: string;
    person2_id: string;
    relationship_type: string;
  }> = [];

  function hasLink(
    parentId: string,
    childId: string,
    type: string
  ): boolean {
    return (
      relationships.some(
        (relation) =>
          relation.person1_id === parentId &&
          relation.person2_id === childId &&
          relation.relationship_type === type
      ) ||
      missing.some(
        (relation) =>
          relation.person1_id === parentId &&
          relation.person2_id === childId &&
          relation.relationship_type === type
      )
    );
  }

  for (const relation of relationships) {
    if (relation.relationship_type !== "sibling") continue;

    const pairs: Array<[string, string]> = [
      [relation.person1_id, relation.person2_id],
      [relation.person2_id, relation.person1_id],
    ];

    for (const [fromChildId, toChildId] of pairs) {
      for (const parentRel of relationships) {
        if (parentRel.person2_id !== fromChildId) continue;
        if (
          parentRel.relationship_type !== "father" &&
          parentRel.relationship_type !== "mother"
        ) {
          continue;
        }

        if (
          !hasLink(
            parentRel.person1_id,
            toChildId,
            parentRel.relationship_type
          )
        ) {
          missing.push({
            family_id: familyId,
            person1_id: parentRel.person1_id,
            person2_id: toChildId,
            relationship_type: parentRel.relationship_type,
          });
        }
      }
    }
  }

  return missing;
}
