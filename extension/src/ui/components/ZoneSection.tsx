import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { DeckCard, Zone } from "../../lib/deck/types";
import {
  groupAndSortZone,
  TYPE_DISPLAY_LABELS,
  COLOR_GROUP_DISPLAY_LABELS,
  type GroupingAxis,
  type SortAxis,
} from "../../lib/organizer/group-sort";
import { isBudgetCounted } from "../../lib/budget/calculate-budget";
import { CardRow } from "./CardRow";
import { CardVisualTile } from "./CardVisualTile";

/**
 * Translates a group's English classification key (from group-sort.ts) to
 * its Portuguese display label. Mana Cost groups are numeric (or "?" for
 * unresolved) and need no translation.
 */
function groupDisplayLabel(axis: GroupingAxis, type: string): string {
  if (axis === "type") return TYPE_DISPLAY_LABELS[type as keyof typeof TYPE_DISPLAY_LABELS] ?? type;
  if (axis === "color") return COLOR_GROUP_DISPLAY_LABELS[type] ?? type;
  return type;
}

export type ViewMode = "list" | "visual";

// "Comandante" and "Maybeboard" are kept exactly as LigaMagic's own page
// shows them (see zone-labels.ts); "Main Deck" and "Companheiro" are this
// app's own display labels (LigaMagic's page has no header for the former,
// and the latter is shortened from LigaMagic's "Comandante Parceiro" for a
// cleaner hero-column caption) — the underlying zone id (`comandanteParceiro`)
// is unchanged, only its rendered label.
const ZONE_LABELS: Record<Zone, string> = {
  comandante: "Comandante",
  comandanteParceiro: "Companheiro",
  mainDeck: "Main Deck",
  maybeboard: "Maybeboard",
};

export interface ZoneSectionProps {
  zone: Zone;
  cards: DeckCard[];
  error?: string;
  illegalCardIds?: ReadonlySet<string>;
  isDeckOverBudget?: boolean;
  viewMode?: ViewMode;
  groupingAxis?: GroupingAxis;
  sortAxis?: SortAxis;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  onRemoveCard?: (cardId: string) => void;
  /**
   * Renders this zone in TabRoot's Commander hero block instead of a normal
   * list/grid zone: forces Visual-mode tiles at hero size regardless of the
   * global view toggle, and drops the type/color/cmc group label (redundant
   * once a zone holds only the one or two commander cards). Everything else
   * — drag-and-drop, grouping, error display — is unchanged.
   */
  hero?: boolean;
  /**
   * Deck Principal's List view only: lays out each group in its own CSS
   * multi-column flow (Moxfield-style) instead of stacking groups in one
   * long vertical list. Ignored in Visual mode, which already wraps tiles
   * into a grid. Maybeboard's narrower column doesn't get this — not enough
   * width for multiple side-by-side groups.
   */
  multiColumn?: boolean;
  /**
   * Adds an independent name-filter control to this zone's header (per
   * deck-organizer's "Per-zone name filter" delta). Not lifted to TabRoot —
   * nothing outside this zone's own render needs its filter text, since
   * budget/card count/legality are computed elsewhere from the full,
   * unfiltered card list regardless of what any zone chooses to display.
   * Set only on Main Deck and Maybeboard; the hero zones never get it.
   */
  filterable?: boolean;
}

export function ZoneSection({
  zone,
  cards,
  error,
  illegalCardIds,
  isDeckOverBudget,
  viewMode = "list",
  groupingAxis = "type",
  sortAxis = "cmc",
  onQuantityChange,
  onRemoveCard,
  hero = false,
  multiColumn = false,
  filterable = false,
}: ZoneSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const [filterText, setFilterText] = useState("");
  const effectiveViewMode = hero ? "visual" : viewMode;
  const trimmedFilter = filterText.trim().toLowerCase();
  const visibleCards =
    filterable && trimmedFilter
      ? cards.filter((c) => c.name.toLowerCase().includes(trimmedFilter))
      : cards;
  const groups = groupAndSortZone(visibleCards, groupingAxis, sortAxis);
  const cardCount = visibleCards.reduce((sum, c) => sum + c.quantity, 0);
  // A hero zone with no card (typically Companheiro when there's no partner
  // commander) collapses to a slim hint instead of reserving full hero-art
  // height — see design.md's "shrink when there is no card" decision.
  const heroEmpty = hero && cards.length === 0;

  return (
    <section className={`c500-zone${hero ? " c500-zone--hero" : ""}${heroEmpty ? " c500-zone--hero-empty" : ""}`}>
      <div className="c500-zone__header">
        {ZONE_LABELS[zone]}
        <span className="c500-zone__count">({cardCount})</span>
        {filterable && (
          <input
            type="text"
            className="c500-zone__filter"
            placeholder="Filtrar por nome…"
            aria-label={`filtrar ${ZONE_LABELS[zone]} por nome`}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        )}
      </div>
      {error && <div className="c500-zone__error">{error}</div>}
      <div
        ref={setNodeRef}
        className={`c500-zone__dropzone${isOver ? " c500-zone__dropzone--active" : ""}${effectiveViewMode === "visual" ? " c500-zone__dropzone--visual" : ""}${multiColumn && effectiveViewMode === "list" ? " c500-zone__dropzone--columns" : ""}`}
      >
        {groups.map((group) => (
          <div key={group.type}>
            {!hero && (
              <div className="c500-group__label">
                {groupDisplayLabel(groupingAxis, group.type)}
                <span className="c500-group__count">
                  ({group.cards.reduce((sum, c) => sum + c.quantity, 0)})
                </span>
              </div>
            )}
            <div className={effectiveViewMode === "visual" ? "c500-tile-grid" : undefined}>
              {group.cards.map((card) =>
                effectiveViewMode === "visual" ? (
                  <CardVisualTile
                    key={card.id}
                    card={card}
                    size={hero ? "hero" : "default"}
                    illegal={illegalCardIds?.has(card.id)}
                    overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemoveCard}
                  />
                ) : (
                  <CardRow
                    key={card.id}
                    card={card}
                    illegal={illegalCardIds?.has(card.id)}
                    overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemoveCard}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
