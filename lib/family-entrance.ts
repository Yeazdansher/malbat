/**
 * Soft-Refresh im Stammbaum soll die Entrance-Animation nicht erneut starten.
 * Volle Navigation vom Dashboard setzt den Modulzustand zurueck.
 */

let skipEntranceOnce = false;

export function skipFamilyEntranceOnce() {
  skipEntranceOnce = true;
}

export function consumeSkipFamilyEntrance(): boolean {
  const skip = skipEntranceOnce;
  skipEntranceOnce = false;
  return skip;
}
