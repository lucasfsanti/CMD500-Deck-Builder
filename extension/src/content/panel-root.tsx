import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { ZONES, type Format } from "../lib/deck/types";
import { groupCardsByZone } from "../lib/organizer/group-sort";
import { resolveDropZone } from "../lib/organizer/resolve-drop";
import { calculateBudget } from "../lib/budget/calculate-budget";
import { checkLegality } from "../lib/legality/check-legality";
import { ZoneSection } from "../ui/components/ZoneSection";
import { BudgetGauge } from "../ui/components/BudgetGauge";
import { LegalitySummary } from "../ui/components/LegalitySummary";
import { ExportMenu } from "../ui/components/ExportMenu";
import { useDeck } from "./use-deck";
import type { LigaMagicPageKind } from "./page-detection";

export interface PanelRootProps {
  watchRoot: (ParentNode & Node) | null;
  pageKind: LigaMagicPageKind;
}

const FORMAT_LABELS: Record<Format, string> = {
  commander500: "Commander 500",
  commander500Duel: "Commander 500 Duel",
};

export function PanelRoot({ watchRoot, pageKind }: PanelRootProps) {
  const { cards, pageStatus, format, setFormat, zoneError, moveCard, setQuantity } = useDeck(
    watchRoot,
    pageKind,
  );

  const byZone = groupCardsByZone(cards);
  const budget = calculateBudget(cards);
  const legality = checkLegality(cards, format);

  function handleDragEnd(event: DragEndEvent) {
    const toZone = resolveDropZone(event);
    if (!toZone) return;
    moveCard(event.active.id as string, toZone);
  }

  return (
    <div className="c500-panel">
      <header className="c500-panel__header">
        <span className="c500-panel__mark" aria-hidden="true" />
        <h1 className="c500-panel__title">Commander 500</h1>
        <select
          className="c500-panel__format"
          value={format}
          onChange={(e) => setFormat(e.target.value as Format)}
        >
          {Object.entries(FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </header>

      {pageStatus === "reading" && <p className="c500-panel__status">Reading this deck…</p>}
      {pageStatus === "unrecognized-page" && (
        <p className="c500-panel__status">
          Could not read this page. LigaMagic may have changed its layout.
        </p>
      )}

      {pageStatus === "ok" && <BudgetGauge budget={budget} />}
      {pageStatus === "ok" && <LegalitySummary legality={legality} format={format} />}
      {pageStatus === "ok" && <ExportMenu cards={cards} />}

      {pageStatus === "ok" && (
        <DndContext onDragEnd={handleDragEnd}>
          {ZONES.map((zone) => (
            <ZoneSection
              key={zone}
              zone={zone}
              cards={byZone[zone]}
              error={zoneError?.zone === zone ? zoneError.message : undefined}
              illegalCardIds={legality.illegalCardIds}
              isDeckOverBudget={budget.isOverCap}
              onQuantityChange={setQuantity}
            />
          ))}
        </DndContext>
      )}
    </div>
  );
}
