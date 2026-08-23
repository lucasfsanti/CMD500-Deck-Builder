import { useDraggable } from "@dnd-kit/core";
import type { DeckCard } from "../../lib/deck/types";
import { resolveCardArt } from "./card-art";

function formatPrice(price: number | undefined): string {
  if (price === undefined) return "—";
  return `R$${price.toFixed(2).replace(".", ",")}`;
}

interface CardVisualTileContentProps {
  card: DeckCard;
  illegal?: boolean;
  overBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
}

function CardVisualTileContent({ card, illegal, overBudget, onQuantityChange }: CardVisualTileContentProps) {
  const { imageUrl, unresolved: artUnresolved } = resolveCardArt(card);

  return (
    <>
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
          <span className="c500-card__badge c500-card__badge--illegal" title="Ilegal neste formato" />
        )}
        <input
          className="c500-tile__qty"
          type="number"
          min={0}
          value={card.quantity}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onQuantityChange?.(card.id, Number.parseInt(e.target.value, 10) || 0)}
          aria-label={`quantidade de ${card.name}`}
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
    </>
  );
}

export interface CardVisualTileProps {
  card: DeckCard;
  illegal?: boolean;
  overBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  /** Extra class name(s), e.g. for the DragOverlay clone's "lifted" styling. */
  className?: string;
  /**
   * True when this instance is the DragOverlay's rendered clone rather than
   * the zone's own tile — skips useDraggable so the clone doesn't register a
   * second draggable under the same card id as the original tile.
   */
  dragOverlay?: boolean;
}

/** Visual-view counterpart to CardRow: an artwork tile instead of a name-only row. */
export function CardVisualTile({
  card,
  illegal,
  overBudget,
  onQuantityChange,
  className,
  dragOverlay,
}: CardVisualTileProps) {
  if (dragOverlay) {
    return (
      <div className={`c500-tile${className ? ` ${className}` : ""}`}>
        <CardVisualTileContent card={card} illegal={illegal} overBudget={overBudget} />
      </div>
    );
  }

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div
      ref={setNodeRef}
      className={`c500-tile${isDragging ? " c500-tile--dragging" : ""}${className ? ` ${className}` : ""}`}
      {...listeners}
      {...attributes}
    >
      <CardVisualTileContent
        card={card}
        illegal={illegal}
        overBudget={overBudget}
        onQuantityChange={onQuantityChange}
      />
    </div>
  );
}
