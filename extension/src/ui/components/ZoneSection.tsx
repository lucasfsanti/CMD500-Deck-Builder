import { useDroppable } from "@dnd-kit/core";
import type { DeckCard, Zone } from "../../lib/deck/types";
import { groupAndSortZone } from "../../lib/organizer/group-sort";
import { isBudgetCounted } from "../../lib/budget/calculate-budget";
import { CardRow } from "./CardRow";

const ZONE_LABELS: Record<Zone, string> = {
  comandante: "Comandante",
  comandanteParceiro: "Comandante Parceiro",
  mainDeck: "Main Deck",
  sideboard: "Sideboard",
  maybeboard: "Maybeboard",
};

export interface ZoneSectionProps {
  zone: Zone;
  cards: DeckCard[];
  error?: string;
  illegalCardIds?: ReadonlySet<string>;
  isDeckOverBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
}

export function ZoneSection({
  zone,
  cards,
  error,
  illegalCardIds,
  isDeckOverBudget,
  onQuantityChange,
}: ZoneSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const groups = groupAndSortZone(cards);
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
        className={`c500-zone__dropzone${isOver ? " c500-zone__dropzone--active" : ""}`}
      >
        {groups.map((group) => (
          <div key={group.type}>
            <div className="c500-group__label">{group.type}</div>
            {group.cards.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                illegal={illegalCardIds?.has(card.id)}
                overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                onQuantityChange={onQuantityChange}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
