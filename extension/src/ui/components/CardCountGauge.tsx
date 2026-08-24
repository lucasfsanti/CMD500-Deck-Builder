import { CARD_COUNT_CAP, type CardCountResult } from "../../lib/organizer/calculate-card-count";

// Compact dial sized for the ledger tape's horizontal strip (task 2.2),
// down from the original stacked-sidebar gauge's 26px radius.
const RADIUS = 18;
const CIRCUMFERENCE = Math.PI * RADIUS; // half-circle arc length

export interface CardCountGaugeProps {
  cardCount: CardCountResult;
}

/** deck-size-limit's visual feedback: a half-circle gauge mirroring BudgetGauge's over-cap treatment. */
export function CardCountGauge({ cardCount }: CardCountGaugeProps) {
  const fraction = Math.min(1, cardCount.total / CARD_COUNT_CAP);
  const dash = fraction * CIRCUMFERENCE;

  return (
    <div className={`c500-gauge${cardCount.isOverCap ? " c500-gauge--over" : ""}`}>
      <svg className="c500-gauge__dial" width="48" height="28" viewBox="0 0 48 28">
        <path
          className="c500-gauge__arc-track"
          d={`M 6 24 A ${RADIUS} ${RADIUS} 0 0 1 42 24`}
        />
        <path
          className="c500-gauge__arc-fill"
          d={`M 6 24 A ${RADIUS} ${RADIUS} 0 0 1 42 24`}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="c500-gauge__body">
        <div className="c500-gauge__amount">{cardCount.total}</div>
        <div className="c500-gauge__cap">de {CARD_COUNT_CAP} cartas</div>
        {cardCount.isOverCap && (
          <div className="c500-gauge__over-note">{cardCount.overAmount} acima</div>
        )}
      </div>
    </div>
  );
}
