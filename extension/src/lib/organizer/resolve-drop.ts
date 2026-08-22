import { ZONES, type Zone } from "../deck/types";

const ZONE_SET: ReadonlySet<string> = new Set(ZONES);

function isZone(value: unknown): value is Zone {
  return typeof value === "string" && ZONE_SET.has(value);
}

/**
 * Resolves a dnd-kit drag-end event to the zone it was dropped on, per
 * deck-organizer's "drop outside any recognized zone" scenario: returns
 * undefined when there was no valid drop target (dropped outside any
 * droppable, or onto something whose id isn't a recognized zone), so the
 * caller can leave the card in its original zone rather than moving it.
 */
export function resolveDropZone(event: { over: { id: unknown } | null }): Zone | undefined {
  const id = event.over?.id;
  return isZone(id) ? id : undefined;
}
