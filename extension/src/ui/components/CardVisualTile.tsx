import { useDraggable } from "@dnd-kit/core";
import { isBasicLand, type DeckCard } from "../../lib/deck/types";
import { displayName, type NameLanguage } from "../../lib/deck/display-name";
import { resolveCardArt } from "./card-art";
import { manaRailForColorIdentity } from "../../lib/organizer/mana-colors";

function formatPrice(price: number | undefined): string {
  if (price === undefined) return "—";
  return `R$${price.toFixed(2).replace(".", ",")}`;
}

interface CardVisualTileContentProps {
  card: DeckCard;
  illegal?: boolean;
  overBudget?: boolean;
  nameLanguage?: NameLanguage;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  onRemove?: (cardId: string) => void;
  /** Only the hero tile shows a name caption — grid tiles rely on artwork alone (card-visual-view spec). */
  showCaption?: boolean;
}

function CardVisualTileContent({
  card,
  illegal,
  overBudget,
  nameLanguage = "en",
  onQuantityChange,
  onRemove,
  showCaption,
}: CardVisualTileContentProps) {
  const { imageUrl, unresolved: artUnresolved } = resolveCardArt(card);
  const rail = manaRailForColorIdentity(card.enrichment?.colorIdentity);
  const railStyle = {
    borderLeftColor: rail.colorVar,
    boxShadow: rail.keyline ? "inset 2px 0 0 var(--c500-text)" : undefined,
  };
  const name = displayName(card, nameLanguage);

  return (
    <>
      <div className="c500-tile__art" style={railStyle}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="c500-tile__img" />
        ) : (
          <div
            className={`c500-tile__placeholder${artUnresolved ? " c500-tile__placeholder--unresolved" : ""}`}
          >
            {name}
          </div>
        )}
        {illegal && (
          <span className="c500-card__badge c500-card__badge--illegal" title="Ilegal neste formato" />
        )}
        {isBasicLand(card.name) && (
          <input
            className="c500-tile__qty"
            type="number"
            min={0}
            value={card.quantity}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onQuantityChange?.(card.id, Number.parseInt(e.target.value, 10) || 0)}
            aria-label={`quantidade de ${name}`}
          />
        )}
        {onRemove && (
          <button
            type="button"
            className="c500-tile__remove"
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
      </div>
      {showCaption && (
        <div className="c500-tile__caption" title={name}>
          {name}
        </div>
      )}
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
  /** Active card-name display language, per card-name-language's spec. Defaults to English. */
  nameLanguage?: NameLanguage;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  onRemove?: (cardId: string) => void;
  /** Extra class name(s), e.g. for the DragOverlay clone's "lifted" styling. */
  className?: string;
  /**
   * True when this instance is the DragOverlay's rendered clone rather than
   * the zone's own tile — skips useDraggable so the clone doesn't register a
   * second draggable under the same card id as the original tile.
   */
  dragOverlay?: boolean;
  /** "hero" renders a much larger tile, used for the Commander hero block. */
  size?: "default" | "hero";
}

/** Visual-view counterpart to CardRow: an artwork tile instead of a name-only row. */
export function CardVisualTile({
  card,
  illegal,
  overBudget,
  nameLanguage = "en",
  onQuantityChange,
  onRemove,
  className,
  dragOverlay,
  size = "default",
}: CardVisualTileProps) {
  const sizeClassName = size === "hero" ? " c500-tile--hero" : "";

  const showCaption = size === "hero";

  if (dragOverlay) {
    return (
      <div className={`c500-tile${sizeClassName}${className ? ` ${className}` : ""}`}>
        <CardVisualTileContent
          card={card}
          illegal={illegal}
          overBudget={overBudget}
          nameLanguage={nameLanguage}
          showCaption={showCaption}
        />
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
      className={`c500-tile${sizeClassName}${isDragging ? " c500-tile--dragging" : ""}${className ? ` ${className}` : ""}`}
      {...listeners}
      {...attributes}
    >
      <CardVisualTileContent
        card={card}
        illegal={illegal}
        overBudget={overBudget}
        nameLanguage={nameLanguage}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        showCaption={showCaption}
      />
    </div>
  );
}
