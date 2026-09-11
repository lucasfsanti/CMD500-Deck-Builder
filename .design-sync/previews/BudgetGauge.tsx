import { BudgetGauge, calculateBudget } from "cmd500-design-system";
import { mainDeck, mainDeckSpells } from "./_fixtures";

export function UnderBudget() {
  return <BudgetGauge budget={calculateBudget(mainDeckSpells)} />;
}

export function OverBudget() {
  const expensive = mainDeckSpells.map((c) => ({ ...c, pageLowestPrice: 120 }));
  return <BudgetGauge budget={calculateBudget(expensive)} />;
}

/** At least one counted card has no captured price yet. */
export function IncompletePrices() {
  return <BudgetGauge budget={calculateBudget(mainDeck)} />;
}
