import { useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { ZONES, type Format } from "../lib/deck/types";
import { groupCardsByZone, type GroupingAxis } from "../lib/organizer/group-sort";
import { resolveDropZone } from "../lib/organizer/resolve-drop";
import { calculateBudget } from "../lib/budget/calculate-budget";
import { checkLegality } from "../lib/legality/check-legality";
import { ZoneSection, type ViewMode } from "../ui/components/ZoneSection";
import { BudgetGauge } from "../ui/components/BudgetGauge";
import { LegalitySummary } from "../ui/components/LegalitySummary";
import { ExportMenu } from "../ui/components/ExportMenu";
import { BarChart } from "../ui/components/charts/BarChart";
import { manaCurveBuckets, colorBuckets, typeBuckets } from "../lib/analytics/bucket-counts";
import { useTabDeck } from "./use-tab-deck";
import { useSourceTabStatus } from "./use-source-tab-status";
import { getSourceTabIdFromUrl, getDeckIdFromUrl } from "./use-relayed-capture";

const FORMAT_LABELS: Record<Format, string> = {
  commander500: "Commander 500",
  commander500Duel: "Commander 500 Duel",
};

const GROUPING_AXIS_LABELS: Record<GroupingAxis, string> = {
  type: "Type",
  color: "Color",
  cmc: "Mana Cost",
};

export function TabRoot() {
  const url = new URL(window.location.href);
  const sourceTabId = getSourceTabIdFromUrl(url);
  const deckId = getDeckIdFromUrl(url);

  const { cards, pageStatus, format, setFormat, zoneError, moveCard, setQuantity } = useTabDeck(
    sourceTabId,
    deckId,
  );
  const sourceStatus = useSourceTabStatus(sourceTabId);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupingAxis, setGroupingAxis] = useState<GroupingAxis>("type");

  const byZone = groupCardsByZone(cards);
  const budget = calculateBudget(cards);
  const legality = checkLegality(cards, format);

  function handleDragEnd(event: DragEndEvent) {
    const toZone = resolveDropZone(event);
    if (!toZone) return;
    moveCard(event.active.id as string, toZone);
  }

  return (
    <div className="c500-tab">
      <header className="c500-tab__header">
        <span className="c500-panel__mark" aria-hidden="true" />
        <h1 className="c500-tab__title">Commander 500 Deckbuilder</h1>
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
        {sourceStatus === "closed" && (
          <span className="c500-tab__unsynced">
            Not synced — the source LigaMagic tab was closed
          </span>
        )}
      </header>

      {pageStatus === "reading" && <p className="c500-tab__status">Reading this deck…</p>}
      {pageStatus === "unrecognized-page" && (
        <p className="c500-tab__status">
          Could not read this page. LigaMagic may have changed its layout.
        </p>
      )}

      {pageStatus === "ok" && (
        <div className="c500-tab__body">
          <aside className="c500-tab__sidebar">
            <BudgetGauge budget={budget} />
            <LegalitySummary legality={legality} format={format} />
            <div className="c500-tab__view-toggle" role="group" aria-label="View mode">
              <span className="c500-tab__view-toggle-label">View</span>
              <button
                type="button"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "visual"}
                onClick={() => setViewMode("visual")}
              >
                Visual
              </button>
            </div>
            <label className="c500-tab__grouping">
              Group by
              <select
                value={groupingAxis}
                onChange={(e) => setGroupingAxis(e.target.value as GroupingAxis)}
              >
                {Object.entries(GROUPING_AXIS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <ExportMenu cards={cards} />
            <BarChart title="Mana Curve" buckets={manaCurveBuckets(cards)} />
            <BarChart title="Color" buckets={colorBuckets(cards)} />
            <BarChart title="Type" buckets={typeBuckets(cards)} />
          </aside>

          <DndContext onDragEnd={handleDragEnd}>
            <div className="c500-tab__zones">
              {/* Main Deck is always far larger than the other four zones (~90-100
                  cards vs. a handful); it gets its own column so the smaller zones
                  stack at their own height instead of being pushed below it. */}
              <div className="c500-tab__zones-side">
                {ZONES.filter((zone) => zone !== "mainDeck").map((zone) => (
                  <ZoneSection
                    key={zone}
                    zone={zone}
                    cards={byZone[zone]}
                    error={zoneError?.zone === zone ? zoneError.message : undefined}
                    illegalCardIds={legality.illegalCardIds}
                    isDeckOverBudget={budget.isOverCap}
                    viewMode={viewMode}
                    groupingAxis={groupingAxis}
                    onQuantityChange={setQuantity}
                  />
                ))}
              </div>
              <ZoneSection
                zone="mainDeck"
                cards={byZone.mainDeck}
                error={zoneError?.zone === "mainDeck" ? zoneError.message : undefined}
                illegalCardIds={legality.illegalCardIds}
                isDeckOverBudget={budget.isOverCap}
                viewMode={viewMode}
                groupingAxis={groupingAxis}
                onQuantityChange={setQuantity}
              />
            </div>
          </DndContext>
        </div>
      )}
    </div>
  );
}
