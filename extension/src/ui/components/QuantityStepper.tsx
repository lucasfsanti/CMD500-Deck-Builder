import type { DeckCard } from "../../lib/deck/types";

export interface QuantityStepperProps {
  card: DeckCard;
  /** Display name used in the stepper's aria-labels. */
  name: string;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  /** Called instead of onQuantityChange whenever the resulting quantity would be 0 or less. */
  onRemove?: (cardId: string) => void;
}

/**
 * Shared add/remove/edit quantity control for basic lands in CardRow and
 * CardVisualTile, per deck-organizer's manual-quantity-edit requirement.
 * Reaching 0 — by the "−" button or by typing 0 directly — removes the card
 * entirely (the same path the dedicated removal control uses) instead of
 * leaving a visible 0-quantity row.
 */
export function QuantityStepper({ card, name, onQuantityChange, onRemove }: QuantityStepperProps) {
  function commit(next: number) {
    if (next <= 0) {
      onRemove?.(card.id);
    } else {
      onQuantityChange?.(card.id, next);
    }
  }

  function stop(e: { stopPropagation: () => void }) {
    e.stopPropagation();
  }

  return (
    <div className="c500-qty-stepper">
      <button
        type="button"
        className="c500-qty-stepper__btn"
        aria-label={`diminuir quantidade de ${name}`}
        onClick={(e) => {
          stop(e);
          commit(card.quantity - 1);
        }}
        onPointerDown={stop}
      >
        −
      </button>
      <input
        type="number"
        min={0}
        className="c500-qty-stepper__input"
        value={card.quantity}
        onClick={stop}
        onPointerDown={stop}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          commit(Number.isNaN(parsed) ? 0 : parsed);
        }}
        aria-label={`quantidade de ${name}`}
      />
      <button
        type="button"
        className="c500-qty-stepper__btn"
        aria-label={`aumentar quantidade de ${name}`}
        onClick={(e) => {
          stop(e);
          commit(card.quantity + 1);
        }}
        onPointerDown={stop}
      >
        +
      </button>
    </div>
  );
}
