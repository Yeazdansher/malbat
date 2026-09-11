/**
 * Malbat Tree Engine
 *
 * Öffentliche API der Tree Engine.
 *
 * Die Engine ist in vier klar getrennte Bereiche
 * aufgeteilt:
 *
 * - types     → Domänenmodelle
 * - graph     → Aufbau des internen TreeGraph
 * - layout    → Berechnung der Positionen
 * - renderer  → Umwandlung in React Flow Nodes/Edges
 *
 * Die einzelnen Module kennen jeweils nur ihre eigene
 * Verantwortung.
 */

export * from "./types";
export * from "./graph";
export * from "./layout";
export * from "./renderer";