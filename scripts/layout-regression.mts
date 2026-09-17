/**
 * Regression: Cousinen-Ehe + Kind darf nicht in Herkunftsgeschwister greifen;
 * Ehefrau steht neben dem Mann; keine Karten-Überlappung.
 */
import { buildTreeGraph } from "../lib/tree-engine/graph.ts";
import { buildTreeLayout } from "../lib/tree-engine/layout.ts";
import type { Person, Relationship } from "../lib/tree-engine/types.ts";

const CARD = 270;
const GAP = 40;

function person(
  id: string,
  first: string,
  gender: "male" | "female",
  birth_date: string | null = null
): Person {
  return {
    id,
    family_id: "f",
    first_name: first,
    last_name: "",
    gender,
    birth_date,
    birth_place: null,
    is_deceased: false,
    death_date: null,
    death_place: null,
    notes: null,
  };
}

function pos(
  layout: ReturnType<typeof buildTreeLayout>,
  id: string
): { x: number; y: number } {
  const node = layout.nodes.find((entry) => entry.id === id);
  if (!node) {
    throw new Error(`missing node ${id}`);
  }
  return node.position;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function noOverlaps(layout: ReturnType<typeof buildTreeLayout>): void {
  const byY = new Map<number, { id: string; x: number }[]>();
  for (const node of layout.nodes) {
    if (node.type !== "person") continue;
    const y = Math.round(node.position.y);
    const row = byY.get(y) ?? [];
    row.push({ id: node.id, x: node.position.x });
    byY.set(y, row);
  }

  for (const [y, row] of byY) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const gap = row[i].x - (row[i - 1].x + CARD);
      assert(
        gap >= GAP - 0.5,
        `overlap at y=${y}: ${row[i - 1].id} / ${row[i].id} gap=${gap}`
      );
    }
  }
}

/** Kind-Block-Mitte nahe der Eltern-Mitte (keine unnötige Links-Verschiebung). */
function childrenUnderParents(
  layout: ReturnType<typeof buildTreeLayout>,
  parentIds: string[],
  childIds: string[],
  maxDrift = CARD
): void {
  const parents = parentIds.map((id) => pos(layout, id));
  const children = childIds.map((id) => pos(layout, id));
  const parentCenter =
    parents.reduce((sum, p) => sum + p.x + CARD / 2, 0) / parents.length;
  const childLeft = Math.min(...children.map((p) => p.x));
  const childRight = Math.max(...children.map((p) => p.x + CARD));
  const childCenter = (childLeft + childRight) / 2;
  assert(
    Math.abs(childCenter - parentCenter) <= maxDrift + 0.5,
    `children not under parents: childCenter=${childCenter} parentCenter=${parentCenter} drift=${Math.abs(childCenter - parentCenter)}`
  );
}

function contiguousIds(
  layout: ReturnType<typeof buildTreeLayout>,
  ids: string[]
): boolean {
  const positions = ids.map((id) => ({ id, ...pos(layout, id) }));
  const y = Math.round(positions[0].y);
  assert(
    positions.every((p) => Math.round(p.y) === y),
    "group not on same row"
  );

  const row = layout.nodes
    .filter(
      (n) => n.type === "person" && Math.round(n.position.y) === y
    )
    .map((n) => ({ id: n.id, x: n.position.x }))
    .sort((a, b) => a.x - b.x);

  const set = new Set(ids);
  const indices = row
    .map((entry, index) => (set.has(entry.id) ? index : -1))
    .filter((index) => index >= 0);

  return indices[indices.length - 1] - indices[0] + 1 === indices.length;
}

function wifeBesideHusband(
  layout: ReturnType<typeof buildTreeLayout>,
  husbandId: string,
  wifeId: string
): void {
  const h = pos(layout, husbandId);
  const w = pos(layout, wifeId);
  assert(Math.abs(h.y - w.y) < 1, `${wifeId} not same Y as ${husbandId}`);
  assert(
    Math.abs(w.x - (h.x + CARD + 56)) < 5,
    `${wifeId} not beside ${husbandId}: hx=${h.x} wx=${w.x}`
  );
}

/** Fall A: Mixeber = Generation von Sileman (wie Screenshot-Mischung). */
function scenarioUncleGeneration(): void {
  const persons = [
    person("root", "Root", "male"),
    person("mixeber", "Mixeber", "male", "1950"),
    person("mazin", "Mazin", "male", "1952"),
    person("sileman", "Sileman", "male", "1954"),
    person("perdenesin", "Perdenesin", "female", "1978"),
    person("mistefa", "Mistefa", "male", "1980"),
    person("gorgin", "Gorgin", "male", "1982"),
    person("gulistan", "Gulistan", "female", "1984"),
    person("kawa", "Kawa", "male", "2000"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "mixeber", relationship_type: "father" },
    { person1_id: "root", person2_id: "mazin", relationship_type: "father" },
    { person1_id: "root", person2_id: "sileman", relationship_type: "father" },
    {
      person1_id: "sileman",
      person2_id: "perdenesin",
      relationship_type: "father",
    },
    {
      person1_id: "sileman",
      person2_id: "mistefa",
      relationship_type: "father",
    },
    { person1_id: "sileman", person2_id: "gorgin", relationship_type: "father" },
    {
      person1_id: "sileman",
      person2_id: "gulistan",
      relationship_type: "father",
    },
    {
      person1_id: "mixeber",
      person2_id: "perdenesin",
      relationship_type: "partner",
    },
    { person1_id: "mixeber", person2_id: "kawa", relationship_type: "father" },
    {
      person1_id: "perdenesin",
      person2_id: "kawa",
      relationship_type: "mother",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "mixeber", "perdenesin");
  noOverlaps(layout);
  childrenUnderParents(layout, ["mixeber", "perdenesin"], ["kawa"]);

  const kawa = pos(layout, "kawa");
  const mistefa = pos(layout, "mistefa");
  if (Math.round(kawa.y) === Math.round(mistefa.y)) {
    assert(
      contiguousIds(layout, ["mistefa", "gorgin", "gulistan"]),
      "ahmad siblings not contiguous"
    );
    assert(
      contiguousIds(layout, ["kawa"]),
      "kawa block broken"
    );
    const ahmad = ["mistefa", "gorgin", "gulistan"].map((id) => pos(layout, id));
    const aLeft = Math.min(...ahmad.map((p) => p.x));
    const aRight = Math.max(...ahmad.map((p) => p.x + CARD));
    assert(
      kawa.x + CARD <= aLeft + 0.5 || kawa.x >= aRight - 0.5,
      `kawa interleaved in ahmad sibs: kawa=${kawa.x} a=[${aLeft},${aRight}]`
    );
  }

  console.log("OK scenarioUncleGeneration");
}

/** Fall B: klassische Cousinen (gleiche Generation). */
function scenarioCousins(): void {
  const persons = [
    person("root", "Root", "male"),
    person("bedran", "Bedran", "male", "1950"),
    person("sileman", "Sileman", "male", "1952"),
    person("mixeber", "Mixeber", "male", "1975"),
    person("mazin", "Mazin", "male", "1977"),
    person("perdenesin", "Perdenesin", "female", "1978"),
    person("mistefa", "Mistefa", "male", "1980"),
    person("kawa", "Kawa", "male", "2000"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "bedran", relationship_type: "father" },
    { person1_id: "root", person2_id: "sileman", relationship_type: "father" },
    { person1_id: "bedran", person2_id: "mixeber", relationship_type: "father" },
    { person1_id: "bedran", person2_id: "mazin", relationship_type: "father" },
    {
      person1_id: "sileman",
      person2_id: "perdenesin",
      relationship_type: "father",
    },
    {
      person1_id: "sileman",
      person2_id: "mistefa",
      relationship_type: "father",
    },
    {
      person1_id: "mixeber",
      person2_id: "perdenesin",
      relationship_type: "partner",
    },
    { person1_id: "mixeber", person2_id: "kawa", relationship_type: "father" },
    {
      person1_id: "perdenesin",
      person2_id: "kawa",
      relationship_type: "mother",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "mixeber", "perdenesin");
  noOverlaps(layout);
  childrenUnderParents(layout, ["mixeber", "perdenesin"], ["kawa"]);

  const kawaY = Math.round(pos(layout, "kawa").y);
  const mistefaY = Math.round(pos(layout, "mistefa").y);
  assert(kawaY !== mistefaY, "kawa should be generation below ahmad sibs");

  // Bedran-Söhne bleiben zusammen; Mistefa (andere Herkunft) nicht dazwischen.
  const mixeberY = Math.round(pos(layout, "mixeber").y);
  const row = layout.nodes
    .filter(
      (n) => n.type === "person" && Math.round(n.position.y) === mixeberY
    )
    .map((n) => ({ id: n.id, x: n.position.x }))
    .sort((a, b) => a.x - b.x)
    .map((n) => n.id);
  const mazinIdx = row.indexOf("mazin");
  const mixeberIdx = row.indexOf("mixeber");
  const mistefaIdx = row.indexOf("mistefa");
  assert(mazinIdx >= 0 && mixeberIdx >= 0 && mistefaIdx >= 0, "missing persons");
  const lo = Math.min(mazinIdx, mixeberIdx);
  const hi = Math.max(mazinIdx, mixeberIdx);
  assert(
    mistefaIdx < lo || mistefaIdx > hi,
    `mistefa interleaved in bedran sons: ${row.join(",")}`
  );

  console.log("OK scenarioCousins");
}

/** Fall C: Jiyana/Keora — Frau wandert zum Mann in derselben Elterngeneration. */
function scenarioSameBranchCousins(): void {
  const persons = [
    person("root", "Root", "male"),
    person("ahmad", "Ahmad", "male", "1950"),
    person("uncle", "Uncle", "male", "1952"),
    person("keora", "Keora", "male", "1975"),
    person("alan", "Alan", "male", "1976"),
    person("jiyana", "Jiyana", "female", "1978"),
    person("armanc", "Armanc", "male", "1980"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "ahmad", relationship_type: "father" },
    { person1_id: "root", person2_id: "uncle", relationship_type: "father" },
    { person1_id: "ahmad", person2_id: "keora", relationship_type: "father" },
    { person1_id: "ahmad", person2_id: "alan", relationship_type: "father" },
    { person1_id: "uncle", person2_id: "jiyana", relationship_type: "father" },
    { person1_id: "uncle", person2_id: "armanc", relationship_type: "father" },
    {
      person1_id: "keora",
      person2_id: "jiyana",
      relationship_type: "partner",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "keora", "jiyana");
  noOverlaps(layout);

  const keoraY = Math.round(pos(layout, "keora").y);
  const row = layout.nodes
    .filter(
      (n) => n.type === "person" && Math.round(n.position.y) === keoraY
    )
    .map((n) => ({ id: n.id, x: n.position.x }))
    .sort((a, b) => a.x - b.x)
    .map((n) => n.id);
  const alanIdx = row.indexOf("alan");
  const keoraIdx = row.indexOf("keora");
  const armancIdx = row.indexOf("armanc");
  const lo = Math.min(alanIdx, keoraIdx);
  const hi = Math.max(alanIdx, keoraIdx);
  assert(
    armancIdx < lo || armancIdx > hi,
    `armanc interleaved in ahmad sons: ${row.join(",")}`
  );

  console.log("OK scenarioSameBranchCousins");
}

scenarioUncleGeneration();
scenarioCousins();
scenarioSameBranchCousins();
scenarioSiblingBranches();
scenarioWifeSiblingOverlap();
console.log("ALL LAYOUT REGRESSIONS PASSED");

/** Fall D: Mehrere Brüder mit eigenen Kinderscharen — Äste müssen Platz machen. */
function scenarioSiblingBranches(): void {
  const persons = [
    person("root", "Root", "male"),
    person("a", "A", "male", "1950"),
    person("b", "B", "male", "1952"),
    person("c", "C", "male", "1954"),
    person("wa", "Wa", "female", "1951"),
    person("wb", "Wb", "female", "1953"),
    person("wc", "Wc", "female", "1955"),
    person("a1", "A1", "male", "1980"),
    person("a2", "A2", "male", "1981"),
    person("a3", "A3", "male", "1982"),
    person("a4", "A4", "male", "1983"),
    person("a5", "A5", "male", "1984"),
    person("b1", "B1", "male", "1985"),
    person("b2", "B2", "male", "1986"),
    person("c1", "C1", "male", "1987"),
    person("c2", "C2", "male", "1988"),
    person("c3", "C3", "male", "1989"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "a", relationship_type: "father" },
    { person1_id: "root", person2_id: "b", relationship_type: "father" },
    { person1_id: "root", person2_id: "c", relationship_type: "father" },
    { person1_id: "a", person2_id: "wa", relationship_type: "partner" },
    { person1_id: "b", person2_id: "wb", relationship_type: "partner" },
    { person1_id: "c", person2_id: "wc", relationship_type: "partner" },
    ...["a1", "a2", "a3", "a4", "a5"].flatMap((id) => [
      {
        person1_id: "a",
        person2_id: id,
        relationship_type: "father" as const,
      },
      {
        person1_id: "wa",
        person2_id: id,
        relationship_type: "mother" as const,
      },
    ]),
    ...["b1", "b2"].flatMap((id) => [
      {
        person1_id: "b",
        person2_id: id,
        relationship_type: "father" as const,
      },
      {
        person1_id: "wb",
        person2_id: id,
        relationship_type: "mother" as const,
      },
    ]),
    ...["c1", "c2", "c3"].flatMap((id) => [
      {
        person1_id: "c",
        person2_id: id,
        relationship_type: "father" as const,
      },
      {
        person1_id: "wc",
        person2_id: id,
        relationship_type: "mother" as const,
      },
    ]),
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  noOverlaps(layout);
  wifeBesideHusband(layout, "a", "wa");
  wifeBesideHusband(layout, "b", "wb");
  wifeBesideHusband(layout, "c", "wc");

  const aKids = ["a1", "a2", "a3", "a4", "a5"];
  const bKids = ["b1", "b2"];
  const cKids = ["c1", "c2", "c3"];

  childrenUnderParents(layout, ["a", "wa"], aKids, CARD * 1.5);
  childrenUnderParents(layout, ["b", "wb"], bKids, CARD * 1.5);
  childrenUnderParents(layout, ["c", "wc"], cKids, CARD * 1.5);

  assert(contiguousIds(layout, aKids), "A-kids not contiguous");
  assert(contiguousIds(layout, bKids), "B-kids not contiguous");
  assert(contiguousIds(layout, cKids), "C-kids not contiguous");

  const aRight = Math.max(...aKids.map((id) => pos(layout, id).x + CARD));
  const bLeft = Math.min(...bKids.map((id) => pos(layout, id).x));
  const bRight = Math.max(...bKids.map((id) => pos(layout, id).x + CARD));
  const cLeft = Math.min(...cKids.map((id) => pos(layout, id).x));
  assert(aRight + 40 <= bLeft + 0.5, `A/B branches not separated: ${aRight} vs ${bLeft}`);
  assert(bRight + 40 <= cLeft + 0.5, `B/C branches not separated: ${bRight} vs ${cLeft}`);

  console.log("OK scenarioSiblingBranches");
}

/** Fall E: Ehefrau neben Mann darf nicht mit nächster Schwester überlappen. */
function scenarioWifeSiblingOverlap(): void {
  const persons = [
    person("root", "Root", "male"),
    person("bedran", "Bedran", "male", "1950"),
    person("wife", "Wife", "female", "1952"),
    person("xezal", "Xezal", "female", "1954"),
    person("silte", "Silte", "male", "1956"),
  ];

  const relationships: Relationship[] = [
    { person1_id: "root", person2_id: "bedran", relationship_type: "father" },
    { person1_id: "root", person2_id: "xezal", relationship_type: "father" },
    { person1_id: "root", person2_id: "silte", relationship_type: "father" },
    {
      person1_id: "bedran",
      person2_id: "wife",
      relationship_type: "partner",
    },
  ];

  const layout = buildTreeLayout(buildTreeGraph(persons, relationships));
  wifeBesideHusband(layout, "bedran", "wife");
  noOverlaps(layout);

  const rowY = Math.round(pos(layout, "bedran").y);
  const row = layout.nodes
    .filter(
      (n) => n.type === "person" && Math.round(n.position.y) === rowY
    )
    .map((n) => ({ id: n.id, x: n.position.x }))
    .sort((a, b) => a.x - b.x);

  const wife = row.find((e) => e.id === "wife");
  const xezal = row.find((e) => e.id === "xezal");
  assert(Boolean(wife && xezal), "wife/xezal missing on row");
  assert(
    wife!.x + CARD <= xezal!.x - GAP + 0.5,
    `wife overlaps xezal: wife=${wife!.x} xezal=${xezal!.x}`
  );

  console.log("OK scenarioWifeSiblingOverlap");
}
