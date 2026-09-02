import { arrayMove } from "@dnd-kit/sortable";
import { ZONES, type DeckCard, type GroupingAxis, type Zone } from "../deck/types";
import type { NameLanguage } from "../deck/display-name";
import { groupAndSortZone, groupKeyFor, type SortAxis } from "./group-sort";

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

export type DragOutcome =
  | { kind: "move"; cardId: string; toZone: Zone }
  | { kind: "reorder"; groupingAxis: GroupingAxis; groupKey: string; orderedCardIds: string[] }
  | { kind: "noop" };

/**
 * Resolves a dnd-kit drag-end event to what it should actually do, per
 * custom-group-order: a drop that lands on a zone id is a plain zone move
 * (unchanged); a drop that lands on another card in a *different* zone is
 * also a plain zone move (append semantics — only a same-zone drag gets a
 * position); a drop on another card in the *same* zone and the *same* group
 * (a card's group is intrinsic, so a different group is a no-op) computes
 * the new id sequence for that group and reorders it.
 */
export function resolveDragOutcome(
  event: { active: { id: unknown }; over: { id: unknown } | null },
  cards: DeckCard[],
  groupingAxis: GroupingAxis,
  sortAxis: SortAxis,
  sortNameLanguage: NameLanguage,
): DragOutcome {
  const draggedCardId = event.active.id as string;

  const toZone = resolveDropZone(event);
  if (toZone) return { kind: "move", cardId: draggedCardId, toZone };

  const overId = event.over?.id;
  if (overId === undefined) return { kind: "noop" };

  const dragged = cards.find((c) => c.id === draggedCardId);
  const target = cards.find((c) => c.id === overId);
  if (!dragged || !target || dragged.id === target.id) return { kind: "noop" };

  if (dragged.zone !== target.zone) {
    return { kind: "move", cardId: draggedCardId, toZone: target.zone };
  }

  const draggedGroupKey = groupKeyFor(dragged, groupingAxis);
  const targetGroupKey = groupKeyFor(target, groupingAxis);
  if (draggedGroupKey !== targetGroupKey) return { kind: "noop" };

  const zoneCards = cards.filter((c) => c.zone === dragged.zone);
  const group = groupAndSortZone(zoneCards, groupingAxis, sortAxis, sortNameLanguage).find(
    (g) => g.type === draggedGroupKey,
  );
  if (!group) return { kind: "noop" };

  const orderedIds = group.cards.map((c) => c.id);
  const oldIndex = orderedIds.indexOf(dragged.id);
  const newIndex = orderedIds.indexOf(target.id);
  if (oldIndex === -1 || newIndex === -1) return { kind: "noop" };

  return {
    kind: "reorder",
    groupingAxis,
    groupKey: draggedGroupKey,
    orderedCardIds: arrayMove(orderedIds, oldIndex, newIndex),
  };
}
