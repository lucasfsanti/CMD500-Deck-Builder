import { useState, type KeyboardEvent } from "react";
import type { DeckCard } from "../../lib/deck/types";

function formatPrice(price: number | undefined): string {
  if (price === undefined) return "—";
  return `R$${price.toFixed(2).replace(".", ",")}`;
}

export interface PriceCellProps {
  card: DeckCard;
  /** Display name used in the editor's aria-label. */
  name: string;
  overBudget?: boolean;
  /** Base class for the read-only element (e.g. "c500-card__price" or "c500-tile__price"); the unknown/over-budget modifiers are appended the same way in both views. */
  className: string;
  /** "span" for CardRow's inline row, "div" for CardVisualTile's tile layout. */
  as?: "span" | "div";
  title?: string;
  /** Omitting this keeps the price read-only (e.g. the DragOverlay clone). */
  onPriceChange?: (cardId: string, price: number | undefined) => void;
}

/**
 * Shared click-to-edit price display for CardRow and CardVisualTile, per
 * deck-organizer's manual-price-edit requirement. Clicking the formatted
 * price swaps it for a number input; Enter or blur commits, Escape cancels.
 * A non-numeric or negative commit is rejected and the previous price is
 * kept, rather than silently coercing it to something valid.
 */
export function PriceCell({ card, name, overBudget, className, as = "span", title, onPriceChange }: PriceCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const unknown = card.pageLowestPrice === undefined;
  const displayClassName = `${className}${unknown ? " c500-card__price--unknown" : ""}${overBudget ? " c500-card__price--over-budget" : ""}`;

  function startEditing() {
    if (!onPriceChange) return;
    setDraft(card.pageLowestPrice !== undefined ? String(card.pageLowestPrice) : "");
    setEditing(true);
  }

  function commit() {
    const parsed = Number.parseFloat(draft.replace(",", "."));
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onPriceChange?.(card.id, parsed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    else if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        step="0.01"
        className="c500-price-input"
        value={draft}
        autoFocus
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        aria-label={`editar preço de ${name}`}
      />
    );
  }

  const Tag = as;
  return (
    <Tag
      className={displayClassName}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {formatPrice(card.pageLowestPrice)}
    </Tag>
  );
}
