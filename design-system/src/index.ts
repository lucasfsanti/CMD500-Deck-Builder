// CMD500 Deck Builder design system.
//
// Every export below is a re-export of the real component shipped in
// extension/src/ui/components — this package never reimplements them.
// Keeping the source in extension/src means this package can never drift
// from what the extension actually ships.

export { CardRow } from "../../extension/src/ui/components/CardRow";
export type { CardRowProps } from "../../extension/src/ui/components/CardRow";

export { CardVisualTile } from "../../extension/src/ui/components/CardVisualTile";
export type { CardVisualTileProps } from "../../extension/src/ui/components/CardVisualTile";

export { ZoneSection } from "../../extension/src/ui/components/ZoneSection";
export type { ZoneSectionProps, ViewMode } from "../../extension/src/ui/components/ZoneSection";

export { QuantityStepper } from "../../extension/src/ui/components/QuantityStepper";
export type { QuantityStepperProps } from "../../extension/src/ui/components/QuantityStepper";

export { PriceCell } from "../../extension/src/ui/components/PriceCell";
export type { PriceCellProps } from "../../extension/src/ui/components/PriceCell";

export { ManaCostIcons } from "../../extension/src/ui/components/ManaCostIcons";
export type { ManaCostIconsProps } from "../../extension/src/ui/components/ManaCostIcons";

export { BudgetGauge } from "../../extension/src/ui/components/BudgetGauge";
export type { BudgetGaugeProps } from "../../extension/src/ui/components/BudgetGauge";

export { CardCountGauge } from "../../extension/src/ui/components/CardCountGauge";
export type { CardCountGaugeProps } from "../../extension/src/ui/components/CardCountGauge";

export { LegalitySummary } from "../../extension/src/ui/components/LegalitySummary";
export type { LegalitySummaryProps } from "../../extension/src/ui/components/LegalitySummary";

export { ExportMenu } from "../../extension/src/ui/components/ExportMenu";
export type { ExportMenuProps } from "../../extension/src/ui/components/ExportMenu";

export { BarChart } from "../../extension/src/ui/components/charts/BarChart";
export type { BarChartProps } from "../../extension/src/ui/components/charts/BarChart";

// Domain types needed to build realistic props for the components above.
export type {
  DeckCard,
  CapturedCard,
  CardEnrichment,
  EnrichmentResult,
  CardLayout,
  Zone,
  Format,
  Deck,
  GroupingAxis,
} from "../../extension/src/lib/deck/types";
export { ZONES, FORMATS, isBasicLand } from "../../extension/src/lib/deck/types";

export type { NameLanguage } from "../../extension/src/lib/deck/display-name";
export { displayName } from "../../extension/src/lib/deck/display-name";

export type { BudgetResult } from "../../extension/src/lib/budget/calculate-budget";
export { BUDGET_CAP, calculateBudget, isBudgetCounted } from "../../extension/src/lib/budget/calculate-budget";

export type { CardCountResult } from "../../extension/src/lib/organizer/calculate-card-count";
export {
  CARD_COUNT_CAP,
  calculateCardCount,
  isCardCountCounted,
} from "../../extension/src/lib/organizer/calculate-card-count";

export type { LegalityResult } from "../../extension/src/lib/legality/check-legality";
export { checkLegality } from "../../extension/src/lib/legality/check-legality";

export type { Bucket } from "../../extension/src/lib/analytics/bucket-counts";
export {
  manaCurveBuckets,
  colorBuckets,
  typeBuckets,
} from "../../extension/src/lib/analytics/bucket-counts";
