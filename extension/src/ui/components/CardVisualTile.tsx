import { useDraggable } from "@dnd-kit/core";
import type { DeckCard } from "../../lib/deck/types";

function formatPrice(price: number | undefined): string {
  if (price === undefined) return "—";
  return `R$${price.toFixed(2).replace(".", ",")}`;
}

export interface CardVisualTileProps {
  card: DeckCard;
  illegal?: boolean;
  overBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
}

/** Visual-view counterpart to CardRow: an artwork tile instead of a name-only row. */
export function CardVisualTile({ card, illegal, overBudget, onQuantityChange }: CardVisualTileProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });
  // LigaMagic's own page always embeds artwork for a real card, independent
  // of whether Scryfall enrichment succeeds; Scryfall's imageUrl is only a
  // fallback for the rare case the page didn't have one.
  const imageUrl = card.pageImageUrl ?? card.enrichment?.imageUrl;
  const artUnresolved =
    !imageUrl && (card.enrichmentStatus === "unavailable" || card.enrichmentStatus === "not-found");

  return (
    <div
      ref={setNodeRef}
      className={`c500-tile${isDragging ? " c500-tile--dragging" : ""}`}
      {...listeners}
      {...attributes}
    >
      <div className="c500-tile__art">
        {imageUrl ? (
          <img src={imageUrl} alt={card.name} className="c500-tile__img" />
        ) : (
          <div
            className={`c500-tile__placeholder${artUnresolved ? " c500-tile__placeholder--unresolved" : ""}`}
          >
            {card.name}
          </div>
        )}
        {illegal && (
          <span className="c500-card__badge c500-card__badge--illegal" title="Illegal in this format" />
        )}
        <input
          className="c500-tile__qty"
          type="number"
          min={0}
          value={card.quantity}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onQuantityChange?.(card.id, Number.parseInt(e.target.value, 10) || 0)}
          aria-label={`${card.name} quantity`}
        />
      </div>
      <div className="c500-tile__caption" title={card.name}>
        {card.name}
      </div>
      <div
        className={`c500-tile__price${card.pageLowestPrice === undefined ? " c500-card__price--unknown" : ""}${overBudget ? " c500-card__price--over-budget" : ""}`}
      >
        {formatPrice(card.pageLowestPrice)}
      </div>
    </div>
  );
}
