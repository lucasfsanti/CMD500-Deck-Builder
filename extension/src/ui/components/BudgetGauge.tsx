import { BUDGET_CAP, type BudgetResult } from "../../lib/budget/calculate-budget";

// Compact dial sized for the ledger tape's horizontal strip (task 2.2),
// down from the original stacked-sidebar gauge's 26px radius.
const RADIUS = 18;
const CIRCUMFERENCE = Math.PI * RADIUS; // half-circle arc length

function formatBrl(amount: number): string {
  return `R$${amount.toFixed(2).replace(".", ",")}`;
}

export interface BudgetGaugeProps {
  budget: BudgetResult;
}

/** The panel's signature element: a half-circle gauge of spend against the R$500 cap. */
export function BudgetGauge({ budget }: BudgetGaugeProps) {
  const fraction = Math.min(1, budget.total / BUDGET_CAP);
  const dash = fraction * CIRCUMFERENCE;
  // Floored at 0 rather than going negative when over cap — the over-note
  // below already carries the exact overage amount.
  const remaining = Math.max(0, BUDGET_CAP - budget.total);

  return (
    <div className={`c500-gauge${budget.isOverCap ? " c500-gauge--over" : ""}`}>
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
        <div className="c500-gauge__amount">{formatBrl(budget.total)} usados</div>
        <div className="c500-gauge__cap">{formatBrl(remaining)} restantes</div>
        {budget.isOverCap && (
          <div className="c500-gauge__over-note">{formatBrl(budget.overAmount)} acima</div>
        )}
        {!budget.isComplete && (
          <div className="c500-gauge__incomplete-note">
            {budget.cardsMissingPrice.length}{" "}
            {budget.cardsMissingPrice.length === 1 ? "carta sem preço" : "cartas sem preço"}
          </div>
        )}
      </div>
    </div>
  );
}
