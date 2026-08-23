import { useDroppable } from "@dnd-kit/core";
import type { DeckCard, Zone } from "../../lib/deck/types";
import {
  groupAndSortZone,
  TYPE_DISPLAY_LABELS,
  COLOR_GROUP_DISPLAY_LABELS,
  type GroupingAxis,
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

// "Comandante", "Comandante Parceiro", and "Maybeboard" are kept exactly as
// LigaMagic's own page shows them (see zone-labels.ts); "Deck Principal" is
// this app's own label, since LigaMagic's page has no header for that zone.
const ZONE_LABELS: Record<Zone, string> = {
  comandante: "Comandante",
  comandanteParceiro: "Comandante Parceiro",
  mainDeck: "Deck Principal",
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
  onQuantityChange?: (cardId: string, quantity: number) => void;
}

export function ZoneSection({
  zone,
  cards,
  error,
  illegalCardIds,
  isDeckOverBudget,
  viewMode = "list",
  groupingAxis = "type",
  onQuantityChange,
}: ZoneSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const groups = groupAndSortZone(cards, groupingAxis);
  const cardCount = cards.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <section className="c500-zone">
      <div className="c500-zone__header">
        {ZONE_LABELS[zone]}
        <span className="c500-zone__count">({cardCount})</span>
      </div>
      {error && <div className="c500-zone__error">{error}</div>}
      <div
        ref={setNodeRef}
        className={`c500-zone__dropzone${isOver ? " c500-zone__dropzone--active" : ""}${viewMode === "visual" ? " c500-zone__dropzone--visual" : ""}`}
      >
        {groups.map((group) => (
          <div key={group.type}>
            <div className="c500-group__label">{groupDisplayLabel(groupingAxis, group.type)}</div>
            <div className={viewMode === "visual" ? "c500-tile-grid" : undefined}>
              {group.cards.map((card) =>
                viewMode === "visual" ? (
                  <CardVisualTile
                    key={card.id}
                    card={card}
                    illegal={illegalCardIds?.has(card.id)}
                    overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                    onQuantityChange={onQuantityChange}
                  />
                ) : (
                  <CardRow
                    key={card.id}
                    card={card}
                    illegal={illegalCardIds?.has(card.id)}
                    overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                    onQuantityChange={onQuantityChange}
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
