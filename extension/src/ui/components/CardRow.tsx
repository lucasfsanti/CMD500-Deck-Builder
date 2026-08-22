import { useDraggable } from "@dnd-kit/core";
import type { DeckCard } from "../../lib/deck/types";

function formatPrice(price: number | undefined): string {
  if (price === undefined) return "—";
  return `R$${price.toFixed(2).replace(".", ",")}`;
}

export interface CardRowProps {
  card: DeckCard;
  illegal?: boolean;
  /** True when this card counts toward budget and the deck is currently over the R$500 cap. */
  overBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
}

export function CardRow({ card, illegal, overBudget, onQuantityChange }: CardRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div
      ref={setNodeRef}
      className={`c500-card${isDragging ? " c500-card--dragging" : ""}`}
      {...listeners}
      {...attributes}
    >
      <input
        className="c500-card__qty"
        type="number"
        min={0}
        value={card.quantity}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onQuantityChange?.(card.id, Number.parseInt(e.target.value, 10) || 0)}
        aria-label={`${card.name} quantity`}
      />
      {illegal && <span className="c500-card__badge c500-card__badge--illegal" title="Illegal in this format" />}
      <span className="c500-card__name" title={card.name}>
        {card.name}
      </span>
      <span
        className={`c500-card__price${card.pageLowestPrice === undefined ? " c500-card__price--unknown" : ""}${overBudget ? " c500-card__price--over-budget" : ""}`}
        title={overBudget ? "Counts toward the deck being over the R$500 cap" : undefined}
      >
        {formatPrice(card.pageLowestPrice)}
      </span>
    </div>
  );
}
