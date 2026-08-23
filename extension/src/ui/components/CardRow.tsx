import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { DeckCard } from "../../lib/deck/types";
import { resolveCardArt } from "./card-art";

function formatPrice(price: number | undefined): string {
  if (price === undefined) return "—";
  return `R$${price.toFixed(2).replace(".", ",")}`;
}

interface CardRowContentProps {
  card: DeckCard;
  illegal?: boolean;
  overBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
}

function CardRowContent({ card, illegal, overBudget, onQuantityChange }: CardRowContentProps) {
  return (
    <>
      <input
        className="c500-card__qty"
        type="number"
        min={0}
        value={card.quantity}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onQuantityChange?.(card.id, Number.parseInt(e.target.value, 10) || 0)}
        aria-label={`quantidade de ${card.name}`}
      />
      {illegal && <span className="c500-card__badge c500-card__badge--illegal" title="Ilegal neste formato" />}
      <span className="c500-card__name" title={card.name}>
        {card.name}
      </span>
      <span
        className={`c500-card__price${card.pageLowestPrice === undefined ? " c500-card__price--unknown" : ""}${overBudget ? " c500-card__price--over-budget" : ""}`}
        title={overBudget ? "Conta para o deck estar acima do limite de R$500" : undefined}
      >
        {formatPrice(card.pageLowestPrice)}
      </span>
    </>
  );
}

interface CardHoverPreviewProps {
  card: DeckCard;
  x: number;
  y: number;
}

/** card-visual-view's List-mode hover preview: a floating artwork preview near the pointer. */
function CardHoverPreview({ card, x, y }: CardHoverPreviewProps) {
  const { imageUrl, unresolved } = resolveCardArt(card);
  return (
    <div className="c500-hover-preview" style={{ left: x, top: y }}>
      {imageUrl ? (
        <img src={imageUrl} alt={card.name} className="c500-tile__img" />
      ) : (
        <div className={`c500-tile__placeholder${unresolved ? " c500-tile__placeholder--unresolved" : ""}`}>
          {card.name}
        </div>
      )}
    </div>
  );
}

export interface CardRowProps {
  card: DeckCard;
  illegal?: boolean;
  /** True when this card counts toward budget and the deck is currently over the R$500 cap. */
  overBudget?: boolean;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  /** Extra class name(s), e.g. for the DragOverlay clone's "lifted" styling. */
  className?: string;
  /**
   * True when this instance is the DragOverlay's rendered clone rather than
   * the zone's own row — skips useDraggable so the clone doesn't register a
   * second draggable under the same card id as the original row.
   */
  dragOverlay?: boolean;
}

export function CardRow({ card, illegal, overBudget, onQuantityChange, className, dragOverlay }: CardRowProps) {
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (dragOverlay) {
    return (
      <div className={`c500-card${className ? ` ${className}` : ""}`}>
        <CardRowContent card={card} illegal={illegal} overBudget={overBudget} />
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
      className={`c500-card${isDragging ? " c500-card--dragging" : ""}${className ? ` ${className}` : ""}`}
      {...listeners}
      {...attributes}
      onPointerEnter={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
      onPointerMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => setHoverPos(null)}
    >
      <CardRowContent card={card} illegal={illegal} overBudget={overBudget} onQuantityChange={onQuantityChange} />
      {hoverPos && !isDragging && <CardHoverPreview card={card} x={hoverPos.x} y={hoverPos.y} />}
    </div>
  );
}
