import type {
  TreeGraph,
  TreeLayout,
  LayoutNode,
  LayoutEdge,
  Family,
} from "./types";

const CARD_WIDTH = 270;
const CARD_HEIGHT = 176;
const FAMILY_NODE_SIZE = 32;

const PARTNER_GAP = 56;
const SIBLING_GAP = 40;
const FAMILY_GAP = 80;
const GENERATION_GAP = 260;

const START_X = 100;
const START_Y = 100;

const GENDER_ORDER: Record<string, number> = {
  male: 0,
  unknown: 1,
  female: 2,
};

/**
 * Rekursive Layout-Engine.
 *
 * Partner einer Person stehen neben dieser Person.
 * Bei Mann-Frau-Ehen bleibt der Mann in seiner Herkunftsfamilie;
 * die Frau wandert zu ihm (auch bei Cousinen-Ehen).
 * Kinder haengen am Familienpunkt der Eltern
 * und werden unter diesem Punkt ausgerichtet.
 * Schwiegerkinder sind keine Kinder.
 */
export function buildTreeLayout(graph: TreeGraph): TreeLayout {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  const placedPersons = new Set<string>();
  const placedFamilies = new Set<string>();
  const personPositions = new Map<string, { x: number; y: number }>();
  const subtreeWidth = new Map<string, number>();
  const edgeKeys = new Set<string>();

  const familiesByPartner = new Map<string, Family[]>();
  const familyByChild = new Map<string, Family>();

  for (const family of graph.families.values()) {
    for (const partnerId of family.partners) {
      const list = familiesByPartner.get(partnerId);
      if (list) {
        list.push(family);
      } else {
        familiesByPartner.set(partnerId, [family]);
      }
    }

    for (const childId of family.children) {
      if (!familyByChild.has(childId)) {
        familyByChild.set(childId, family);
      }
    }
  }

  function partnerRowWidth(partnerCount: number): number {
    if (partnerCount <= 0) {
      return 0;
    }

    if (partnerCount === 1) {
      return CARD_WIDTH;
    }

    return partnerCount * CARD_WIDTH + (partnerCount - 1) * PARTNER_GAP;
  }

  function orderPartners(partnerIds: string[]): string[] {
    return [...partnerIds].sort((a, b) => {
      const genderA = graph.persons.get(a)?.gender ?? "unknown";
      const genderB = graph.persons.get(b)?.gender ?? "unknown";
      const rankA = GENDER_ORDER[genderA] ?? 1;
      const rankB = GENDER_ORDER[genderB] ?? 1;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.localeCompare(b);
    });
  }

  function genderOf(personId: string): "male" | "female" | "unknown" {
    return graph.persons.get(personId)?.gender ?? "unknown";
  }

  /**
   * Bei Mann-Frau-Ehen: nur der Mann "besitzt" die Union (Frau wandert zu ihm).
   * Sonst: bisheriges Verhalten (jeder darf claimen).
   */
  function canClaimUnion(personId: string, family: Family): boolean {
    if (family.kind === "sibling-group") {
      return false;
    }

    const males = family.partners.filter((id) => genderOf(id) === "male");
    const females = family.partners.filter((id) => genderOf(id) === "female");

    if (males.length === 1 && females.length >= 1) {
      return males[0] === personId;
    }

    return true;
  }

  /** Bevorzugter Anker einer Union (Mann bei Mann-Frau). */
  function preferredUnionAnchor(family: Family): string | undefined {
    const males = family.partners.filter((id) => genderOf(id) === "male");
    const females = family.partners.filter((id) => genderOf(id) === "female");

    if (males.length === 1 && females.length >= 1) {
      return males[0];
    }

    return undefined;
  }

  /**
   * Frau in einer Mann-Frau-Ehe: steht neben dem Mann, nicht in der
   * Geschwisterreihe der Herkunftsfamilie.
   */
  function shouldRelocateBesideHusband(personId: string): boolean {
    if (genderOf(personId) !== "female") {
      return false;
    }

    for (const family of familiesByPartner.get(personId) ?? []) {
      if (family.kind === "sibling-group") {
        continue;
      }

      const preferred = preferredUnionAnchor(family);
      if (preferred && preferred !== personId) {
        return true;
      }
    }

    return false;
  }

  /** Elternkante zur Herkunftsfamilie, sobald die Frau beim Mann steht. */
  function linkBirthFamilyEdge(personId: string): void {
    const birth = familyByChild.get(personId);
    if (!birth || !placedFamilies.has(birth.id)) {
      return;
    }

    addEdge(birth.familyNodeId, personId);
  }

  function pickPlacedUnionAnchor(family: Family): string | undefined {
    const preferred = preferredUnionAnchor(family);
    if (preferred && placedPersons.has(preferred)) {
      return preferred;
    }

    const placed = family.partners.filter((id) => placedPersons.has(id));
    if (placed.length === 0) {
      return undefined;
    }

    // Noch kein Mann platziert: nicht an der Frau andocken (sonst wandert der Mann zu ihr).
    if (preferred && !placedPersons.has(preferred)) {
      return undefined;
    }

    return placed.find((id) => canClaimUnion(id, family)) ?? placed[0];
  }

  function addEdge(source: string, target: string): void {
    const key = `${source}->${target}`;

    if (edgeKeys.has(key)) {
      return;
    }

    edgeKeys.add(key);
    edges.push({ source, target });
  }

  function addFamilyNode(
    family: Family,
    centerX: number,
    centerY: number
  ): void {
    nodes.push({
      type: "family",
      id: family.familyNodeId,
      familyId: family.id,
      position: {
        x: centerX - FAMILY_NODE_SIZE / 2,
        y: centerY - FAMILY_NODE_SIZE / 2,
      },
    });
  }

  function unionsOf(
    personId: string,
    stack: Set<string>
  ): Family[] {
    const families = familiesByPartner.get(personId) ?? [];
    return families.filter((family) => !stack.has(family.id));
  }

  function childIdsOf(family: Family): string[] {
    return family.children
      .filter((id) => graph.persons.has(id))
      .sort((a, b) => {
        const birthA = graph.persons.get(a)?.birth_date ?? null;
        const birthB = graph.persons.get(b)?.birth_date ?? null;

        if (birthA && birthB && birthA !== birthB) {
          // Ältere Kinder (früher geboren) links.
          return birthA.localeCompare(birthB);
        }

        if (birthA && !birthB) {
          return -1;
        }

        if (!birthA && birthB) {
          return 1;
        }

        return a.localeCompare(b);
      });
  }

  function otherPartnersOf(family: Family, personId: string): string[] {
    return family.partners.filter(
      (id) => id !== personId && graph.persons.has(id)
    );
  }

  function measureExtraUnionsOwnGen(
    personId: string,
    skipFamilyId: string,
    visited: Set<string>
  ): number {
    const unions = (familiesByPartner.get(personId) ?? []).filter(
      (family) =>
        !placedFamilies.has(family.id) && family.id !== skipFamilyId
    );

    let width = 0;

    for (const union of unions) {
      const others = otherPartnersOf(union, personId).filter(
        (id) => !visited.has(id)
      );

      for (const partnerId of others) {
        width += PARTNER_GAP + CARD_WIDTH;
        visited.add(partnerId);
        width += measureExtraUnionsOwnGen(partnerId, union.id, visited);
      }
    }

    return width;
  }

  function measureOwnGenerationWidth(personId: string): number {
    if (!graph.persons.has(personId)) {
      return 0;
    }

    if (shouldRelocateBesideHusband(personId)) {
      return 0;
    }

    const unions = unionsForPerson(personId);

    if (unions.length === 0) {
      return CARD_WIDTH;
    }

    // Erste Union rechts; Extra-Partner links in einer Zeile.
    const visited = new Set<string>([personId]);
    let leftWidth = 0;
    let rightWidth = CARD_WIDTH;

    const first = unions[0];
    for (const partnerId of otherPartnersOf(first, personId)) {
      rightWidth += PARTNER_GAP + CARD_WIDTH;
      visited.add(partnerId);
      rightWidth += measureExtraUnionsOwnGen(partnerId, first.id, visited);
    }

    if (otherPartnersOf(first, personId).length === 0) {
      rightWidth += PARTNER_GAP;
    }

    for (let index = 1; index < unions.length; index++) {
      const union = unions[index];
      for (const partnerId of otherPartnersOf(union, personId)) {
        leftWidth += PARTNER_GAP + CARD_WIDTH;
        visited.add(partnerId);
        leftWidth += measureExtraUnionsOwnGen(partnerId, union.id, visited);
      }
    }

    return leftWidth + rightWidth;
  }

  function measurePersonSubtree(
    personId: string,
    stack: Set<string>
  ): number {
    if (!graph.persons.has(personId)) {
      return 0;
    }

    if (shouldRelocateBesideHusband(personId)) {
      return 0;
    }

    const unions = unionsOf(personId, stack).filter(
      (family) => !placedFamilies.has(family.id)
    );

    if (unions.length === 0) {
      return CARD_WIDTH;
    }

    let rowWidth = CARD_WIDTH;
    let descendantsWidth = 0;

    for (const union of unions) {
      const others = otherPartnersOf(union, personId);
      rowWidth += others.length * (PARTNER_GAP + CARD_WIDTH);

      stack.add(union.id);

      const kids = childIdsOf(union).filter(
        (id) => !shouldRelocateBesideHusband(id)
      );
      let kidsWidth = 0;

      for (let index = 0; index < kids.length; index++) {
        if (index > 0) {
          kidsWidth += SIBLING_GAP;
        }

        kidsWidth += measurePersonSubtree(kids[index], stack);
      }

      stack.delete(union.id);
      descendantsWidth = Math.max(descendantsWidth, kidsWidth);
    }

    return Math.max(rowWidth, descendantsWidth, CARD_WIDTH);
  }

  function measureFamily(family: Family, stack: Set<string>): number {
    const cached = subtreeWidth.get(family.id);

    if (cached !== undefined) {
      return cached;
    }

    if (stack.has(family.id)) {
      return partnerRowWidth(family.partners.length);
    }

    stack.add(family.id);

    const rowWidth = partnerRowWidth(family.partners.length);
    const kids = childIdsOf(family).filter(
      (id) => !shouldRelocateBesideHusband(id)
    );
    let childrenWidth = 0;

    for (let index = 0; index < kids.length; index++) {
      if (index > 0) {
        childrenWidth += SIBLING_GAP;
      }

      childrenWidth += measurePersonSubtree(kids[index], stack);
    }

    stack.delete(family.id);

    const partners = orderPartners(family.partners);
    const extraStack = new Set(stack);
    extraStack.add(family.id);

    const extraLeft =
      partners.length > 0
        ? measureExtraUnions(partners[0], extraStack)
        : 0;
    const extraRight =
      partners.length > 1
        ? measureExtraUnions(
            partners[partners.length - 1],
            extraStack
          )
        : 0;

    const width =
      Math.max(rowWidth, childrenWidth, CARD_WIDTH) + extraLeft + extraRight;
    subtreeWidth.set(family.id, width);
    return width;
  }

  function placePerson(personId: string, x: number, y: number): void {
    if (placedPersons.has(personId) || !graph.persons.has(personId)) {
      return;
    }

    placedPersons.add(personId);
    personPositions.set(personId, { x, y });

    nodes.push({
      type: "person",
      id: personId,
      position: { x, y },
    });
  }

  /**
   * Platziert oder verschiebt eine Person (z. B. Ehefrau zur Familie des Mannes).
   */
  function placeOrMovePerson(personId: string, x: number, y: number): void {
    if (!graph.persons.has(personId)) {
      return;
    }

    if (!placedPersons.has(personId)) {
      placePerson(personId, x, y);
      return;
    }

    personPositions.set(personId, { x, y });
    const node = nodes.find(
      (entry) => entry.type === "person" && entry.id === personId
    );
    if (node) {
      node.position = { x, y };
    }
  }

  function nodeIdsSnapshot(): Set<string> {
    return new Set(nodes.map((node) => node.id));
  }

  function newNodeIdsSince(before: Set<string>): string[] {
    return nodes
      .filter((node) => !before.has(node.id))
      .map((node) => node.id);
  }

  function generationRowBounds(
    nodeIds: string[],
    generationY: number
  ): { left: number; right: number } | null {
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;

    for (const id of nodeIds) {
      const node = nodes.find((entry) => entry.id === id);
      if (!node || node.type !== "person") {
        continue;
      }

      if (Math.abs(node.position.y - generationY) > 1) {
        continue;
      }

      left = Math.min(left, node.position.x);
      right = Math.max(right, node.position.x + CARD_WIDTH);
    }

    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      return null;
    }

    return { left, right };
  }

  /** Pro Y-Zeile die Karten-Bounds — verhindert Cousin-Kollisionen ohne volle AABB-Schienen. */
  function boundsByGeneration(
    nodeIds: string[]
  ): Map<number, { left: number; right: number }> {
    const byY = new Map<number, { left: number; right: number }>();

    for (const id of nodeIds) {
      const node = nodes.find((entry) => entry.id === id);
      if (!node || node.type !== "person") {
        continue;
      }

      const y = node.position.y;
      const existing = byY.get(y);

      if (existing) {
        existing.left = Math.min(existing.left, node.position.x);
        existing.right = Math.max(existing.right, node.position.x + CARD_WIDTH);
      } else {
        byY.set(y, {
          left: node.position.x,
          right: node.position.x + CARD_WIDTH,
        });
      }
    }

    return byY;
  }

  function shiftSubtree(nodeIds: string[], dx: number): void {
    if (dx === 0) {
      return;
    }

    for (const id of nodeIds) {
      const node = nodes.find((entry) => entry.id === id);
      if (node) {
        node.position.x += dx;
      }

      const personPos = personPositions.get(id);
      if (personPos) {
        personPos.x += dx;
      }
    }
  }

  /** Verschiebt alle Knoten ab minX nach rechts (hält Teilbäume zusammen). */
  function shiftEverythingFromX(minX: number, dx: number): void {
    if (dx === 0) {
      return;
    }

    for (const node of nodes) {
      if (node.position.x + 0.5 >= minX) {
        node.position.x += dx;
      }
    }

    for (const pos of personPositions.values()) {
      if (pos.x + 0.5 >= minX) {
        pos.x += dx;
      }
    }
  }

  /** Gleiche Generation: Kartenüberlappungen auflösen. */
  function resolveAllPersonOverlaps(): void {
    const rows = new Map<number, { id: string; x: number }[]>();

    for (const [id, pos] of personPositions) {
      const yKey = Math.round(pos.y);
      const row = rows.get(yKey);
      if (row) {
        row.push({ id, x: pos.x });
      } else {
        rows.set(yKey, [{ id, x: pos.x }]);
      }
    }

    for (const row of rows.values()) {
      row.sort((a, b) => a.x - b.x);

      for (let index = 1; index < row.length; index++) {
        const left = row[index - 1];
        const right = row[index];
        const leftPos = personPositions.get(left.id);
        const rightPos = personPositions.get(right.id);
        if (!leftPos || !rightPos) {
          continue;
        }

        const needed = leftPos.x + CARD_WIDTH + SIBLING_GAP - rightPos.x;
        if (needed <= 0) {
          continue;
        }

        const minX = rightPos.x;
        shiftEverythingFromX(minX, needed);

        for (let j = index; j < row.length; j++) {
          row[j].x += needed;
        }
      }
    }
  }

  /**
   * Block-Schlüssel einer Person in einer Generationszeile.
   * Herkunft hält Geschwister zusammen; zugezogene Ehefrauen folgen dem Mann.
   * Kinder einer Ehe bilden den Herkunftsblock dieser Union (nicht fremde Reihen).
   */
  function generationBlockKey(personId: string): string {
    if (shouldRelocateBesideHusband(personId)) {
      for (const family of familiesByPartner.get(personId) ?? []) {
        if (family.kind === "sibling-group") {
          continue;
        }
        const anchor = preferredUnionAnchor(family);
        if (anchor && anchor !== personId) {
          return generationBlockKey(anchor);
        }
      }
    }

    const birth = familyByChild.get(personId);
    if (birth) {
      return `birth:${birth.id}`;
    }

    for (const family of familiesByPartner.get(personId) ?? []) {
      if (family.kind === "sibling-group") {
        continue;
      }
      const anchor = preferredUnionAnchor(family);
      if (
        anchor === personId ||
        (anchor === undefined && canClaimUnion(personId, family))
      ) {
        return `union:${family.id}`;
      }
    }

    return `solo:${personId}`;
  }

  /**
   * Person + beanspruchte Partner/Kinder/Familienknoten.
   * Keine Eltern — sonst entstehen beim Entflechten Riesenlücken in der Elterngeneration.
   */
  function ownedSubtreeIds(
    personId: string,
    visited: Set<string> = new Set()
  ): string[] {
    if (visited.has(personId) || !placedPersons.has(personId)) {
      return [];
    }
    visited.add(personId);

    const ids = new Set<string>([personId]);

    for (const family of familiesByPartner.get(personId) ?? []) {
      if (family.kind === "sibling-group") {
        continue;
      }

      const anchor = preferredUnionAnchor(family);
      if (anchor) {
        if (anchor !== personId) {
          continue;
        }
      } else if (!canClaimUnion(personId, family)) {
        continue;
      }

      ids.add(family.familyNodeId);

      for (const partnerId of otherPartnersOf(family, personId)) {
        if (!placedPersons.has(partnerId)) {
          continue;
        }
        ids.add(partnerId);
      }

      for (const childId of family.children) {
        if (!placedPersons.has(childId) || shouldRelocateBesideHusband(childId)) {
          continue;
        }
        for (const childNodeId of ownedSubtreeIds(childId, visited)) {
          ids.add(childNodeId);
        }
      }
    }

    return [...ids];
  }

  function arePartners(a: string, b: string): boolean {
    for (const family of familiesByPartner.get(a) ?? []) {
      if (family.kind === "sibling-group") {
        continue;
      }
      if (family.partners.includes(b)) {
        return true;
      }
    }
    return false;
  }

  /** Eltern-/Paar-Mittelpunkt (Kartenmitte), Ziel für Kind-Blöcke. */
  function generationBlockIdealCenter(
    blockKey: string,
    members: string[]
  ): number {
    const familyId = blockKey.startsWith("union:")
      ? blockKey.slice("union:".length)
      : blockKey.startsWith("birth:")
        ? blockKey.slice("birth:".length)
        : null;

    if (familyId) {
      const family = graph.families.get(familyId);
      if (family) {
        const centers = family.partners
          .map((id) => {
            const pos = personPositions.get(id);
            return pos ? pos.x + CARD_WIDTH / 2 : undefined;
          })
          .filter((x): x is number => x !== undefined);
        if (centers.length > 0) {
          return centers.reduce((sum, x) => sum + x, 0) / centers.length;
        }
      }
    }

    const xs = members
      .map((id) => personPositions.get(id))
      .filter((pos): pos is { x: number; y: number } => Boolean(pos));
    if (xs.length === 0) {
      return 0;
    }
    const left = Math.min(...xs.map((pos) => pos.x));
    const right = Math.max(...xs.map((pos) => pos.x + CARD_WIDTH));
    return (left + right) / 2;
  }

  /** Sortierschlüssel = Idealzentrum der Eltern. */
  function generationBlockSortX(blockKey: string, members: string[]): number {
    return generationBlockIdealCenter(blockKey, members);
  }

  function minPersonX(personIds: string[]): number {
    let min = Number.POSITIVE_INFINITY;
    for (const id of personIds) {
      const pos = personPositions.get(id);
      if (pos) {
        min = Math.min(min, pos.x);
      }
    }
    return min;
  }

  function rowMembersBounds(
    memberIds: string[],
    yKey: number
  ): { left: number; right: number } | null {
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    for (const id of memberIds) {
      const pos = personPositions.get(id);
      if (pos && Math.round(pos.y) === yKey) {
        left = Math.min(left, pos.x);
        right = Math.max(right, pos.x + CARD_WIDTH);
      }
    }
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      return null;
    }
    return { left, right };
  }

  function rowMembersRight(memberIds: string[], yKey: number): number {
    return rowMembersBounds(memberIds, yKey)?.right ?? Number.NEGATIVE_INFINITY;
  }

  function groupLeaders(members: string[]): string[] {
    return members
      .filter((id) => !shouldRelocateBesideHusband(id))
      .sort(
        (a, b) =>
          (personPositions.get(a)?.x ?? 0) - (personPositions.get(b)?.x ?? 0)
      );
  }

  function groupSubtreeIds(leaders: string[]): string[] {
    const ids = new Set<string>();
    for (const leaderId of leaders) {
      for (const id of ownedSubtreeIds(leaderId)) {
        ids.add(id);
      }
    }
    return [...ids];
  }

  /**
   * Anker zum Verschieben eines Astes: Eltern (andere Zeile), sonst die Leader.
   * So bleiben Kinder unter den Eltern, wenn Äste auseinanderrücken.
   */
  function branchAnchors(blockKey: string, leaders: string[]): string[] {
    const familyId = blockKey.startsWith("union:")
      ? blockKey.slice("union:".length)
      : blockKey.startsWith("birth:")
        ? blockKey.slice("birth:".length)
        : null;

    if (familyId) {
      const family = graph.families.get(familyId);
      if (family) {
        const parents = family.partners.filter(
          (id) => placedPersons.has(id) && !shouldRelocateBesideHusband(id)
        );
        if (parents.length > 0 && leaders.length > 0) {
          const leaderY = personPositions.get(leaders[0])?.y;
          const parentY = personPositions.get(parents[0])?.y;
          if (
            leaderY !== undefined &&
            parentY !== undefined &&
            Math.round(leaderY) !== Math.round(parentY)
          ) {
            return parents;
          }
        }
      }
    }

    return leaders;
  }

  function shiftGroupByLeaders(leaders: string[], dx: number): void {
    if (Math.abs(dx) <= 0.5 || leaders.length === 0) {
      return;
    }
    shiftSubtree(groupSubtreeIds(leaders), dx);
  }

  /**
   * Leader eng setzen, aber volle Unterbaum-Breite einhalten —
   * sonst werden Kind-Äste platt gequetscht.
   */
  function compactGroupLeaders(
    leaders: string[],
    members: string[],
    yKey: number
  ): void {
    if (leaders.length === 0) {
      return;
    }

    const firstPos = personPositions.get(leaders[0]);
    if (!firstPos) {
      return;
    }

    let cursor = firstPos.x;
    let placedSubtreeIds: string[] = [];

    for (let index = 0; index < leaders.length; index++) {
      const leaderId = leaders[index];
      const leaderPos = personPositions.get(leaderId);
      if (!leaderPos) {
        continue;
      }

      const gap =
        index > 0
          ? arePartners(leaders[index - 1], leaderId)
            ? PARTNER_GAP
            : SIBLING_GAP
          : 0;

      if (index > 0) {
        cursor += gap;
      }

      shiftGroupByLeaders([leaderId], cursor - leaderPos.x);

      if (placedSubtreeIds.length > 0) {
        const extra = requiredOverlapShift(
          placedSubtreeIds,
          ownedSubtreeIds(leaderId),
          gap
        );
        if (extra > 0.5) {
          shiftGroupByLeaders([leaderId], extra);
        }
      }

      placedSubtreeIds = placedSubtreeIds.concat(ownedSubtreeIds(leaderId));

      const placedLeaders = leaders.slice(0, index + 1);
      const onRowIds = members.filter((id) => {
        const pos = personPositions.get(id);
        if (!pos || Math.round(pos.y) !== yKey) {
          return false;
        }
        if (placedLeaders.includes(id)) {
          return true;
        }
        return (
          shouldRelocateBesideHusband(id) &&
          placedLeaders.some((lid) => arePartners(lid, id))
        );
      });
      const right = rowMembersRight(onRowIds, yKey);
      cursor = Number.isFinite(right) ? right : cursor + CARD_WIDTH;
    }
  }

  function recenterUnionFamilyNodes(): void {
    for (const family of graph.families.values()) {
      if (family.kind === "sibling-group") {
        continue;
      }
      if (!nodes.some((node) => node.id === family.familyNodeId)) {
        continue;
      }

      const partnerPositions = family.partners
        .map((id) => personPositions.get(id))
        .filter((pos): pos is { x: number; y: number } => Boolean(pos));

      if (partnerPositions.length === 0) {
        continue;
      }

      const centerX =
        partnerPositions.reduce(
          (sum, pos) => sum + pos.x + CARD_WIDTH / 2,
          0
        ) / partnerPositions.length;
      const centerY =
        partnerPositions.reduce((sum, pos) => sum + pos.y, 0) /
          partnerPositions.length +
        CARD_HEIGHT / 2;

      moveFamilyNodeTo(family.familyNodeId, centerX, centerY);
    }
  }

  /**
   * Blöcke eng halten, Kinder unter Eltern zentrieren, Äste bei Kollision
   * als Ganzes (Eltern+Kinder) auseinanderschieben.
   */
  function packGenerationFamilyBlocks(): void {
    const rows = new Map<number, string[]>();

    for (const [id, pos] of personPositions) {
      const yKey = Math.round(pos.y);
      const row = rows.get(yKey);
      if (row) {
        row.push(id);
      } else {
        rows.set(yKey, [id]);
      }
    }

    const sortedYs = [...rows.keys()].sort((a, b) => a - b);

    type PackedGroup = {
      key: string;
      members: string[];
      leaders: string[];
      idealCenter: number;
    };

    for (const yKey of sortedYs) {
      const personIds = rows.get(yKey);
      if (!personIds || personIds.length < 1) {
        continue;
      }

      const groups = new Map<string, string[]>();
      for (const id of personIds) {
        const key = generationBlockKey(id);
        const list = groups.get(key);
        if (list) {
          list.push(id);
        } else {
          groups.set(key, [id]);
        }
      }

      const orderedGroups = [...groups.entries()].sort(
        (a, b) =>
          generationBlockSortX(a[0], a[1]) - generationBlockSortX(b[0], b[1])
      );

      const packed: PackedGroup[] = [];

      for (const [blockKey, members] of orderedGroups) {
        const leaders = groupLeaders(members);
        if (leaders.length === 0) {
          continue;
        }

        compactGroupLeaders(leaders, members, yKey);

        const bounds = rowMembersBounds(members, yKey);
        if (!bounds) {
          continue;
        }

        const idealCenter = generationBlockIdealCenter(blockKey, members);
        const currentCenter = (bounds.left + bounds.right) / 2;
        shiftGroupByLeaders(leaders, idealCenter - currentCenter);

        packed.push({
          key: blockKey,
          members,
          leaders,
          idealCenter,
        });
      }

      // Äste trennen: rechten Eltern-Ast verschieben (Kinder bleiben darunter).
      packed.sort((a, b) => a.idealCenter - b.idealCenter);

      for (let index = 1; index < packed.length; index++) {
        const left = packed[index - 1];
        const right = packed[index];
        const needed = requiredOverlapShift(
          groupSubtreeIds(left.leaders),
          groupSubtreeIds(right.leaders),
          FAMILY_GAP
        );
        if (needed > 0.5) {
          shiftGroupByLeaders(branchAnchors(right.key, right.leaders), needed);
        }
      }
    }

    recenterUnionFamilyNodes();
  }

  function requiredOverlapShift(
    leftIds: string[],
    rightIds: string[],
    gap: number = SIBLING_GAP
  ): number {
    const leftByY = boundsByGeneration(leftIds);
    const rightByY = boundsByGeneration(rightIds);
    let shift = 0;

    for (const [y, rightBounds] of rightByY) {
      const leftBounds = leftByY.get(y);
      if (!leftBounds) {
        continue;
      }

      const needed = leftBounds.right + gap - rightBounds.left;
      if (needed > shift) {
        shift = needed;
      }
    }

    return shift;
  }

  function resolveSiblingOverlaps(
    subtreeNodeIds: string[][],
    gap: number = SIBLING_GAP
  ): void {
    const groups = subtreeNodeIds.filter((ids) => ids.length > 0);

    for (let index = 1; index < groups.length; index++) {
      const shift = requiredOverlapShift(
        groups[index - 1],
        groups[index],
        gap
      );
      if (shift > 0) {
        shiftSubtree(groups[index], shift);
      }
    }
  }

  function recenterSiblingBlock(
    subtreeNodeIds: string[][],
    targetCenterX: number,
    generationY: number
  ): void {
    const allIds = subtreeNodeIds.flat();
    if (allIds.length === 0) {
      return;
    }

    const bounds = generationRowBounds(allIds, generationY);
    if (!bounds) {
      return;
    }

    const currentCenter = (bounds.left + bounds.right) / 2;
    shiftSubtree(allIds, targetCenterX - currentCenter);
  }

  function captureSubtree(before: Set<string>, rootPersonId: string): string[] {
    const ids = newNodeIdsSince(before);
    if (ids.length === 0) {
      return [];
    }
    if (
      !ids.includes(rootPersonId) &&
      placedPersons.has(rootPersonId) &&
      !shouldRelocateBesideHusband(rootPersonId)
    ) {
      ids.push(rootPersonId);
    }
    return ids;
  }

  function moveFamilyNodeTo(familyNodeId: string, centerX: number, centerY: number): void {
    const node = nodes.find((entry) => entry.id === familyNodeId);
    if (!node) {
      return;
    }

    node.position.x = centerX - FAMILY_NODE_SIZE / 2;
    node.position.y = centerY - FAMILY_NODE_SIZE / 2;
  }

  function placeChildren(
    family: Family,
    familyCenterX: number,
    y: number
  ): void {
    const kids = childIdsOf(family);

    if (kids.length === 0) {
      return;
    }

    const localKids = kids.filter((id) => !shouldRelocateBesideHusband(id));
    const relocatedWives = kids.filter((id) => shouldRelocateBesideHusband(id));

    for (const wifeId of relocatedWives) {
      if (placedPersons.has(wifeId)) {
        addEdge(family.familyNodeId, wifeId);
      }
    }

    if (localKids.length === 0) {
      return;
    }

    // Nur eigene Generationsbreite vorplanen; Enkel-Kollisionen
    // werden danach per resolveSiblingOverlaps (echte Bounds) gelöst.
    const childWidths = localKids.map((id) => measureOwnGenerationWidth(id));

    const offsets: number[] = [];
    let offset = 0;

    for (let index = 0; index < localKids.length; index++) {
      offsets.push(offset);
      offset += childWidths[index] + SIBLING_GAP;
    }

    const childCenterSum = offsets.reduce(
      (sum, childOffset, index) =>
        sum + childOffset + childWidths[index] / 2,
      0
    );
    const childCenterAverage = childCenterSum / localKids.length;
    const blockLeft = familyCenterX - childCenterAverage;

    const subtreeNodeIds: string[][] = [];

    for (let index = 0; index < localKids.length; index++) {
      const childId = localKids[index];
      const before = nodeIdsSnapshot();
      placePersonWithPartners(childId, blockLeft + offsets[index], y);
      addEdge(family.familyNodeId, childId);
      subtreeNodeIds.push(captureSubtree(before, childId));
    }

    resolveSiblingOverlaps(subtreeNodeIds);
    recenterSiblingBlock(subtreeNodeIds, familyCenterX, y);
  }

  function preferredExtraDirection(personId: string): "left" | "right" {
    const origin = personPositions.get(personId);
    if (!origin) {
      return "right";
    }

    for (const family of familiesByPartner.get(personId) ?? []) {
      if (!placedFamilies.has(family.id)) {
        continue;
      }

      for (const partnerId of otherPartnersOf(family, personId)) {
        const partnerPos = personPositions.get(partnerId);
        if (!partnerPos) {
          continue;
        }

        if (partnerPos.x >= origin.x) {
          return "left";
        }

        return "right";
      }
    }

    return "right";
  }

  function unionsForPerson(personId: string): Family[] {
    return (familiesByPartner.get(personId) ?? [])
      .filter((family) => !placedFamilies.has(family.id))
      .filter((family) => canClaimUnion(personId, family))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Linke/rechte Außenkante bereits platzierter Partner dieser Person. */
  function personPartnerExtent(
    personId: string,
    side: "left" | "right"
  ): number {
    const origin = personPositions.get(personId);
    if (!origin) {
      return 0;
    }

    let edge = side === "left" ? origin.x : origin.x + CARD_WIDTH;

    for (const family of familiesByPartner.get(personId) ?? []) {
      if (!placedFamilies.has(family.id)) {
        continue;
      }

      for (const partnerId of otherPartnersOf(family, personId)) {
        const pos = personPositions.get(partnerId);
        if (!pos) {
          continue;
        }

        if (side === "left") {
          edge = Math.min(edge, pos.x);
        } else {
          edge = Math.max(edge, pos.x + CARD_WIDTH);
        }
      }
    }

    return edge;
  }

  function placePersonWithPartners(
    personId: string,
    x: number,
    y: number
  ): void {
    // Bereits als Partnerin beim Mann platziert → nicht erneut in der Herkunftsreihe andocken.
    if (placedPersons.has(personId)) {
      const claimable = unionsForPerson(personId);
      if (claimable.length > 0) {
        placeExtraUnions(personId, preferredExtraDirection(personId));
      }
      return;
    }

    const unions = unionsForPerson(personId);
    const extraUnionsList = unions.slice(1);

    let leftWidth = 0;
    if (extraUnionsList.length > 0) {
      const visited = new Set<string>([personId]);
      for (const union of extraUnionsList) {
        for (const partnerId of otherPartnersOf(union, personId)) {
          leftWidth += PARTNER_GAP + CARD_WIDTH;
          visited.add(partnerId);
          leftWidth += measureExtraUnionsOwnGen(partnerId, union.id, visited);
        }
      }
    }

    const personX = x + leftWidth;
    placePerson(personId, personX, y);

    if (unions.length === 0) {
      return;
    }

    const first = unions[0];
    placedFamilies.add(first.id);

    const others = otherPartnersOf(first, personId);
    let cursorX = personX + CARD_WIDTH;
    const familyCenterX = cursorX + PARTNER_GAP / 2;
    const familyCenterY = y + CARD_HEIGHT / 2;

    addFamilyNode(first, familyCenterX, familyCenterY);
    addEdge(personId, first.familyNodeId);

    cursorX += PARTNER_GAP;

    for (const partnerId of others) {
      placeOrMovePerson(partnerId, cursorX, y);
      addEdge(partnerId, first.familyNodeId);
      linkBirthFamilyEdge(partnerId);
      cursorX += CARD_WIDTH + PARTNER_GAP;
    }

    if (others.length === 0) {
      cursorX += PARTNER_GAP;
    }

    placeChildren(first, familyCenterX, y + GENERATION_GAP);

    for (const partnerId of others) {
      placeExtraUnions(partnerId, "right");
    }

    const extraDir = preferredExtraDirection(personId);
    for (let index = 0; index < extraUnionsList.length; index++) {
      placeExtraUnion(personId, extraUnionsList[index], extraDir, index);
    }
  }

  function extraUnionsOf(personId: string): Family[] {
    return (familiesByPartner.get(personId) ?? []).filter(
      (family) =>
        !placedFamilies.has(family.id) && canClaimUnion(personId, family)
    );
  }

  function measureExtraUnions(
    personId: string,
    stack: Set<string>
  ): number {
    const unions = unionsOf(personId, stack).filter(
      (family) => !placedFamilies.has(family.id)
    );

    let width = 0;

    for (const union of unions) {
      const others = otherPartnersOf(union, personId);
      width += others.length * (PARTNER_GAP + CARD_WIDTH);

      stack.add(union.id);

      const kids = childIdsOf(union).filter(
        (id) => !shouldRelocateBesideHusband(id)
      );
      let kidsWidth = 0;

      for (let index = 0; index < kids.length; index++) {
        if (index > 0) {
          kidsWidth += SIBLING_GAP;
        }

        kidsWidth += measurePersonSubtree(kids[index], stack);
      }

      stack.delete(union.id);
      width = Math.max(width, kidsWidth);
    }

    return width;
  }

  /**
   * Extra-Partner in der Zeile des Ankers.
   * Direkt benachbart: Family-Knoten auf der Verbindungslinie.
   * Weiter außen: Family-Knoten oberhalb (Brücke über dazwischenliegende Partner).
   */
  function placeExtraUnion(
    personId: string,
    union: Family,
    direction: "left" | "right",
    stackIndex: number
  ): void {
    const origin = personPositions.get(personId);
    if (!origin || placedFamilies.has(union.id)) {
      return;
    }

    placedFamilies.add(union.id);

    const others = otherPartnersOf(union, personId);
    const placedPartnerXs: number[] = [];

    if (direction === "right") {
      let cursorX = personPartnerExtent(personId, "right");
      for (const partnerId of others) {
        cursorX += PARTNER_GAP;
        placeOrMovePerson(partnerId, cursorX, origin.y);
        linkBirthFamilyEdge(partnerId);
        placedPartnerXs.push(cursorX);
        cursorX += CARD_WIDTH;
      }
    } else {
      let cursorX = personPartnerExtent(personId, "left");
      for (const partnerId of others) {
        cursorX -= PARTNER_GAP + CARD_WIDTH;
        placeOrMovePerson(partnerId, cursorX, origin.y);
        linkBirthFamilyEdge(partnerId);
        placedPartnerXs.push(cursorX);
      }
    }

    if (placedPartnerXs.length === 0) {
      const familyCenterX =
        direction === "right"
          ? origin.x + CARD_WIDTH + PARTNER_GAP / 2
          : origin.x - PARTNER_GAP / 2;
      addFamilyNode(union, familyCenterX, origin.y + CARD_HEIGHT / 2);
      addEdge(personId, union.familyNodeId);
      placeChildren(union, familyCenterX, origin.y + GENERATION_GAP);
      return;
    }

    const partnerInnerEdge =
      direction === "left"
        ? Math.max(...placedPartnerXs) + CARD_WIDTH
        : Math.min(...placedPartnerXs);
    const anchorInnerEdge =
      direction === "left" ? origin.x : origin.x + CARD_WIDTH;

    // Mittelpunkt zwischen diesem Partner und dem Anker (über ggf. andere Partner hinweg).
    const familyCenterX = (partnerInnerEdge + anchorInnerEdge) / 2;

    // Erster Extra-Partner: auf der Kartenlinie. Weitere: darüber = Bogen wie markiert.
    const familyCenterY =
      stackIndex === 0
        ? origin.y + CARD_HEIGHT / 2
        : origin.y - 36 - (stackIndex - 1) * (FAMILY_NODE_SIZE + 24);

    addFamilyNode(union, familyCenterX, familyCenterY);
    addEdge(personId, union.familyNodeId);

    for (const partnerId of others) {
      addEdge(partnerId, union.familyNodeId);
    }

    const childrenCenterX =
      placedPartnerXs.reduce((sum, px) => sum + px + CARD_WIDTH / 2, 0) /
      placedPartnerXs.length;

    placeChildren(union, childrenCenterX, origin.y + GENERATION_GAP);

    for (const partnerId of others) {
      placeExtraUnions(partnerId, direction);
    }
  }

  function placeExtraUnions(
    personId: string,
    direction: "left" | "right"
  ): void {
    const unions = extraUnionsOf(personId);

    for (let index = 0; index < unions.length; index++) {
      placeExtraUnion(personId, unions[index], direction, index);
    }
  }

  function placeFamily(family: Family, boxLeft: number, y: number): void {
    if (placedFamilies.has(family.id)) {
      return;
    }

    // Familie hängt schon an einer platzierten Person → außen anhängen, keine neue Reihe.
    const placedAnchor = pickPlacedUnionAnchor(family);
    if (placedAnchor && family.kind !== "sibling-group") {
      placeExtraUnions(placedAnchor, preferredExtraDirection(placedAnchor));
      return;
    }

    // Geschwistergruppe ohne Eltern: nebeneinander in einer Generation.
    if (
      family.kind === "sibling-group" ||
      (family.partners.length === 0 && family.children.length > 0)
    ) {
      placedFamilies.add(family.id);

      const kids = childIdsOf(family);
      if (kids.length === 0) {
        return;
      }

      const localKids = kids.filter((id) => !shouldRelocateBesideHusband(id));
      const relocatedWives = kids.filter((id) =>
        shouldRelocateBesideHusband(id)
      );

      if (localKids.length === 0) {
        return;
      }

      const childWidths = localKids.map((id) => measureOwnGenerationWidth(id));
      const offsets: number[] = [];
      let offset = 0;

      for (let index = 0; index < localKids.length; index++) {
        offsets.push(offset);
        offset += childWidths[index] + SIBLING_GAP;
      }

      const totalWidth = offset - SIBLING_GAP;
      const blockLeft =
        boxLeft +
        Math.max(0, (measureFamily(family, new Set()) - totalWidth) / 2);
      const childCenterSum = offsets.reduce(
        (sum, childOffset, index) =>
          sum + childOffset + childWidths[index] / 2,
        0
      );
      const familyCenterX = blockLeft + childCenterSum / localKids.length;
      // Sammelschiene knapp über den Karten; Knoten sitzt auf der Schiene.
      const familyCenterY = y - 36;

      addFamilyNode(family, familyCenterX, familyCenterY);

      for (const wifeId of relocatedWives) {
        if (placedPersons.has(wifeId)) {
          addEdge(family.familyNodeId, wifeId);
        }
      }

      const subtreeNodeIds: string[][] = [];

      for (let index = 0; index < localKids.length; index++) {
        const childId = localKids[index];
        const before = nodeIdsSnapshot();
        placePersonWithPartners(childId, blockLeft + offsets[index], y);
        addEdge(family.familyNodeId, childId);
        subtreeNodeIds.push(captureSubtree(before, childId));
      }

      resolveSiblingOverlaps(subtreeNodeIds);

      const packed = generationRowBounds(subtreeNodeIds.flat(), y);
      if (packed) {
        const packedCenter = (packed.left + packed.right) / 2;
        moveFamilyNodeTo(family.familyNodeId, packedCenter, familyCenterY);
      }

      return;
    }

    placedFamilies.add(family.id);

    const width = measureFamily(family, new Set());
    const partners = orderPartners(family.partners);
    const rowWidth = partnerRowWidth(partners.length);
    const extraStack = new Set<string>([family.id]);
    const extraLeft =
      partners.length > 0
        ? measureExtraUnions(partners[0], extraStack)
        : 0;
    const extraRight =
      partners.length > 1
        ? measureExtraUnions(
            partners[partners.length - 1],
            extraStack
          )
        : 0;

    const innerWidth = width - extraLeft - extraRight;
    const rowLeft = boxLeft + extraLeft + (innerWidth - rowWidth) / 2;

    let partnerX = rowLeft;

    for (const partnerId of partners) {
      placePerson(partnerId, partnerX, y);
      partnerX += CARD_WIDTH + PARTNER_GAP;
    }

    const familyCenterX =
      partners.length <= 1
        ? rowLeft + CARD_WIDTH / 2
        : rowLeft + rowWidth / 2;

    const familyCenterY =
      partners.length <= 1
        ? y + CARD_HEIGHT
        : y + CARD_HEIGHT / 2;

    addFamilyNode(family, familyCenterX, familyCenterY);

    for (const partnerId of partners) {
      if (graph.persons.has(partnerId)) {
        addEdge(partnerId, family.familyNodeId);
      }
    }

    const beforeChildren = nodeIdsSnapshot();
    placeChildren(family, familyCenterX, y + GENERATION_GAP);
    const mainChildIds = newNodeIdsSince(beforeChildren);

    if (partners.length > 0) {
      const beforeLeft = nodeIdsSnapshot();
      placeExtraUnions(partners[0], "left");
      const leftIds = newNodeIdsSince(beforeLeft);

      const beforeRight = nodeIdsSnapshot();
      placeExtraUnions(partners[partners.length - 1], "right");
      const rightIds = newNodeIdsSince(beforeRight);

      resolveSiblingOverlaps([leftIds, mainChildIds, rightIds]);
    }
  }

  function isRootFamily(family: Family): boolean {
    return family.partners.every(
      (partnerId) => !familyByChild.has(partnerId)
    );
  }

  const rootFamilies = [...graph.families.values()].filter(isRootFamily);

  const familiesToPlace =
    rootFamilies.length > 0
      ? rootFamilies
      : [...graph.families.values()];

  const topLevelSubtrees: string[][] = [];

  // Alle Wurzeläste zuerst übereinander legen, dann nur so weit
  // auseinanderschieben wie die echten Teilbaum-Bounds brauchen.
  for (const family of familiesToPlace) {
    const before = nodeIdsSnapshot();
    placeFamily(family, START_X, START_Y);
    topLevelSubtrees.push(newNodeIdsSince(before));
  }

  for (const family of graph.families.values()) {
    if (placedFamilies.has(family.id)) {
      continue;
    }

    const placedPartner = pickPlacedUnionAnchor(family);

    if (placedPartner) {
      placeExtraUnions(placedPartner, preferredExtraDirection(placedPartner));
      continue;
    }

    const before = nodeIdsSnapshot();
    placeFamily(family, START_X, START_Y);
    topLevelSubtrees.push(newNodeIdsSince(before));
  }

  resolveSiblingOverlaps(topLevelSubtrees, FAMILY_GAP);

  for (const personId of graph.persons.keys()) {
    if (placedPersons.has(personId)) {
      continue;
    }

    const before = nodeIdsSnapshot();
    placePersonWithPartners(personId, START_X, START_Y);
    topLevelSubtrees.push(newNodeIdsSince(before));
  }

  resolveSiblingOverlaps(topLevelSubtrees, FAMILY_GAP);

  /**
   * Cousinen-Ehen: Ehefrau fest neben den Mann setzen, falls sie
   * noch in der Herkunftsreihe lag — danach Überlappungen lösen.
   */
  function reconcileRelocatedWives(): void {
    for (const family of graph.families.values()) {
      if (family.kind === "sibling-group") {
        continue;
      }

      const husbandId = preferredUnionAnchor(family);
      if (!husbandId || !placedPersons.has(husbandId)) {
        continue;
      }

      const origin = personPositions.get(husbandId);
      if (!origin) {
        continue;
      }

      const wives = otherPartnersOf(family, husbandId).filter((id) =>
        shouldRelocateBesideHusband(id)
      );

      if (wives.length === 0) {
        continue;
      }

      let cursorX = origin.x + CARD_WIDTH + PARTNER_GAP;

      for (const wifeId of wives) {
        placeOrMovePerson(wifeId, cursorX, origin.y);
        linkBirthFamilyEdge(wifeId);
        addEdge(wifeId, family.familyNodeId);
        addEdge(husbandId, family.familyNodeId);
        cursorX += CARD_WIDTH + PARTNER_GAP;
      }

      if (nodes.some((node) => node.id === family.familyNodeId)) {
        moveFamilyNodeTo(
          family.familyNodeId,
          origin.x + CARD_WIDTH + PARTNER_GAP / 2,
          origin.y + CARD_HEIGHT / 2
        );
      }
    }
  }

  reconcileRelocatedWives();
  packGenerationFamilyBlocks();
  reconcileRelocatedWives();
  resolveAllPersonOverlaps();
  packGenerationFamilyBlocks();
  reconcileRelocatedWives();
  // Letzter Partner-Fix kann Ehefrau über die nächste Geschwisterkarte legen.
  resolveAllPersonOverlaps();

  return { nodes, edges };
}
