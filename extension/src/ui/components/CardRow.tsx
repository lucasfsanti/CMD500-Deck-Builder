import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isBasicLand, type DeckCard } from "../../lib/deck/types";
import { displayName, type NameLanguage } from "../../lib/deck/display-name";
import { resolveCardArt } from "./card-art";
import { manaRailForColorIdentity } from "../../lib/organizer/mana-colors";
import { ManaCostIcons } from "./ManaCostIcons";
import { PriceCell } from "./PriceCell";
import { QuantityStepper } from "./QuantityStepper";

interface CardRowContentProps {
  card: DeckCard;
  illegal?: boolean;
  overBudget?: boolean;
  nameLanguage?: NameLanguage;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  onRemove?: (cardId: string) => void;
  onPriceChange?: (cardId: string, price: number | undefined) => void;
}

function CardRowContent({
  card,
  illegal,
  overBudget,
  nameLanguage = "en",
  onQuantityChange,
  onRemove,
  onPriceChange,
}: CardRowContentProps) {
  const name = displayName(card, nameLanguage);
  const basicLand = isBasicLand(card.name);
  return (
    <>
      {illegal && <span className="c500-card__badge c500-card__badge--illegal" title="Ilegal neste formato" />}
      <span className="c500-card__name" title={name}>
        {name}
      </span>
      {card.enrichment?.faceManaCosts ? (
        <ManaCostIcons symbolGroups={card.enrichment.faceManaCosts} />
      ) : (
        <ManaCostIcons symbols={card.pageManaCostSymbols} />
      )}
      {basicLand ? (
        <QuantityStepper card={card} name={name} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      ) : (
        <PriceCell
          card={card}
          name={name}
          overBudget={overBudget}
          className="c500-card__price"
          title={overBudget ? "Conta para o deck estar acima do limite de R$500" : undefined}
          onPriceChange={onPriceChange}
        />
      )}
      {onRemove && (
        <button
          type="button"
          className="c500-card__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(card.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`remover ${name} do deck`}
        >
          ×
        </button>
      )}
    </>
  );
}

interface CardHoverPreviewProps {
  card: DeckCard;
  x: number;
  y: number;
  nameLanguage?: NameLanguage;
}

/** card-visual-view's List-mode hover preview: a floating artwork preview near the pointer. */
function CardHoverPreview({ card, x, y, nameLanguage = "en" }: CardHoverPreviewProps) {
  const { imageUrl, unresolved } = resolveCardArt(card);
  const name = displayName(card, nameLanguage);
  return (
    <div className="c500-hover-preview" style={{ left: x, top: y }}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="c500-tile__img" />
      ) : (
        <div className={`c500-tile__placeholder${unresolved ? " c500-tile__placeholder--unresolved" : ""}`}>
          {name}
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
  /** Active card-name display language, per card-name-language's spec. Defaults to English. */
  nameLanguage?: NameLanguage;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  onRemove?: (cardId: string) => void;
  onPriceChange?: (cardId: string, price: number | undefined) => void;
  /** Extra class name(s), e.g. for the DragOverlay clone's "lifted" styling. */
  className?: string;
  /**
   * True when this instance is the DragOverlay's rendered clone rather than
   * the zone's own row — skips useDraggable so the clone doesn't register a
   * second draggable under the same card id as the original row.
   */
  dragOverlay?: boolean;
}

export function CardRow({
  card,
  illegal,
  overBudget,
  nameLanguage = "en",
  onQuantityChange,
  onRemove,
  onPriceChange,
  className,
  dragOverlay,
}: CardRowProps) {
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const rail = manaRailForColorIdentity(card.enrichment?.colorIdentity);
  const railStyle = {
    borderLeftColor: rail.colorVar,
    boxShadow: rail.keyline ? "inset 2px 0 0 var(--c500-text)" : undefined,
  };

  if (dragOverlay) {
    return (
      <div className={`c500-card${className ? ` ${className}` : ""}`} style={railStyle}>
        <CardRowContent card={card} illegal={illegal} overBudget={overBudget} nameLanguage={nameLanguage} />
      </div>
    );
  }

  // useSortable (rather than plain useDraggable) also registers this row as
  // a droppable, so another card dragged onto it can resolve as a same-group
  // reorder target (custom-group-order) — not just a zone-level move.
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: card.id,
    data: { card },
  });
  // Applies the shift dnd-kit already computes for every other card in this
  // group while one is being dragged over a new position — the "gap opens
  // between neighbors" reorder preview (zone-header-and-reorder-preview).
  // The dragged row itself gets a transform too (dnd-kit doesn't special-case
  // the active item), which is harmless since it's fully hidden while dragging.
  const sortableStyle = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      className={`c500-card${isDragging ? " c500-card--dragging" : ""}${className ? ` ${className}` : ""}`}
      style={{ ...railStyle, ...sortableStyle }}
      {...listeners}
      {...attributes}
      onPointerEnter={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
      onPointerMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => setHoverPos(null)}
    >
      <CardRowContent
        card={card}
        illegal={illegal}
        overBudget={overBudget}
        nameLanguage={nameLanguage}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        onPriceChange={onPriceChange}
      />
      {hoverPos && !isDragging && (
        <CardHoverPreview card={card} x={hoverPos.x} y={hoverPos.y} nameLanguage={nameLanguage} />
      )}
    </div>
  );
}
