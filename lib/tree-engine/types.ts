/**
 * Grundtypen der neuen Malbat Tree Engine.
 */

/* ----------------------------------------------------------
 * Personen
 * ---------------------------------------------------------- */

type Gender = "male" | "female" | "unknown";

export interface Person {
  id: string;

  family_id: string;

  first_name: string;
  last_name: string;

  gender: Gender;

  birth_date: string | null;
  birth_place: string | null;

  is_deceased: boolean;

  death_date: string | null;
  death_place: string | null;

  notes: string | null;
}

/* ----------------------------------------------------------
 * Beziehungen
 * ---------------------------------------------------------- */

type RelationshipType =
  | "partner"
  | "parent"
  | "adoptive-parent"
  | "father"
  | "mother"
  | "sibling";

export interface Relationship {
  person1_id: string;
  person2_id: string;

  relationship_type: RelationshipType;
}

/* ----------------------------------------------------------
 * Familien
 * ---------------------------------------------------------- */

export interface Family {
  id: string;

  partners: string[];

  children: string[];

  familyNodeId: string;

  /** Parentless sibling cluster (no partners). */
  kind?: "union" | "sibling-group";
}

/* ----------------------------------------------------------
 * Graph
 * ---------------------------------------------------------- */

export interface TreeGraph {
  persons: Map<string, Person>;

  relationships: Relationship[];

  families: Map<string, Family>;
}

/* ----------------------------------------------------------
 * Layout
 * ---------------------------------------------------------- */

interface Point {
  x: number;
  y: number;
}

export interface PersonLayoutNode {
  type: "person";

  id: string;

  position: Point;
}

export interface FamilyLayoutNode {
  type: "family";

  id: string;

  familyId: string;

  position: Point;
}

export type LayoutNode =
  | PersonLayoutNode
  | FamilyLayoutNode;

/* ----------------------------------------------------------
 * Kanten
 * ---------------------------------------------------------- */

export interface LayoutEdge {
  source: string;
  target: string;
}

/* ----------------------------------------------------------
 * Gesamtes Layout
 * ---------------------------------------------------------- */

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}