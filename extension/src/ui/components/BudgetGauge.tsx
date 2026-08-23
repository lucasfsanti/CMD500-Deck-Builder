import { BUDGET_CAP, type BudgetResult } from "../../lib/budget/calculate-budget";

const RADIUS = 26;
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

  return (
    <div className={`c500-gauge${budget.isOverCap ? " c500-gauge--over" : ""}`}>
      <svg className="c500-gauge__dial" width="64" height="38" viewBox="0 0 64 38">
        <path
          className="c500-gauge__arc-track"
          d={`M 6 32 A ${RADIUS} ${RADIUS} 0 0 1 58 32`}
        />
        <path
          className="c500-gauge__arc-fill"
          d={`M 6 32 A ${RADIUS} ${RADIUS} 0 0 1 58 32`}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="c500-gauge__body">
        <div className="c500-gauge__amount">{formatBrl(budget.total)}</div>
        <div className="c500-gauge__cap">de {formatBrl(BUDGET_CAP)} de limite</div>
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
