import { useState } from "react";
import { DndContext, DragOverlay, pointerWithin, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { DeckCard, Format, Zone } from "../lib/deck/types";
import type { NameLanguage } from "../lib/deck/display-name";
import { groupCardsByZone, type GroupingAxis, type SortAxis } from "../lib/organizer/group-sort";
import { resolveDragOutcome } from "../lib/organizer/resolve-drop";
import { calculateBudget } from "../lib/budget/calculate-budget";
import { calculateCardCount } from "../lib/organizer/calculate-card-count";
import { checkLegality } from "../lib/legality/check-legality";
import { MemoryStore } from "../lib/scryfall/cache";
import { ZoneSection, type ViewMode } from "../ui/components/ZoneSection";
import { BudgetGauge } from "../ui/components/BudgetGauge";
import { CardCountGauge } from "../ui/components/CardCountGauge";
import { LegalitySummary } from "../ui/components/LegalitySummary";
import { ExportMenu } from "../ui/components/ExportMenu";
import { BarChart } from "../ui/components/charts/BarChart";
import { CardRow } from "../ui/components/CardRow";
import { CardVisualTile } from "../ui/components/CardVisualTile";
import { manaCurveBuckets, colorBuckets, typeBuckets } from "../lib/analytics/bucket-counts";
import { useDemoDeck } from "./use-demo-deck";
import { useThemePreference } from "../tab/use-theme-preference";
import { useNameLanguagePreference } from "../tab/use-name-language-preference";

/**
 * Standalone, offline copy of TabRoot (extension/src/tab/TabRoot.tsx) for the
 * public GitHub Pages demo: same layout, same components, same
 * drag-and-drop/edit behavior, but reading from `useDemoDeck`'s static mock
 * decklist instead of a relayed LigaMagic capture + live Scryfall enrichment
 * — there is no real extension context here (no chrome.* APIs, no source
 * tab). Kept as its own file rather than adding a "demo mode" branch to
 * TabRoot itself, so the real production component stays untouched.
 */

const FORMAT_LABELS: Record<Format, string> = {
  commander500: "Commander 500",
  commander500Duel: "Commander 500 Duel",
};

const GROUPING_AXIS_LABELS: Record<GroupingAxis, string> = {
  type: "Tipo",
  color: "Cor",
  cmc: "Custo de Mana",
};

const SORT_AXIS_LABELS: Record<SortAxis, string> = {
  cmc: "Custo de Mana",
  name: "Nome",
  color: "Cor",
  price: "Valor (R$)",
};

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="7" y1="0.5" x2="7" y2="2" />
        <line x1="7" y1="12" x2="7" y2="13.5" />
        <line x1="0.5" y1="7" x2="2" y2="7" />
        <line x1="12" y1="7" x2="13.5" y2="7" />
        <line x1="2.4" y1="2.4" x2="3.4" y2="3.4" />
        <line x1="10.6" y1="10.6" x2="11.6" y2="11.6" />
        <line x1="2.4" y1="11.6" x2="3.4" y2="10.6" />
        <line x1="10.6" y1="3.4" x2="11.6" y2="2.4" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M9.5 1.5a6 6 0 1 0 3 8.9A5 5 0 0 1 9.5 1.5Z" fill="currentColor" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 100" className="c500-tab__mark" aria-hidden="true">
      <rect x="5" y="5" width="90" height="90" rx="16" fill="#b1802a" stroke="#2e1f0f" strokeWidth="6" />
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="56"
        fill="#4a86c4"
        stroke="#2e1f0f"
        strokeWidth="5"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        5
      </text>
      {[
        { cx: 20, fill: "#f2efe6" },
        { cx: 35, fill: "#2f6fc0" },
        { cx: 50, fill: "#1c1c1c" },
        { cx: 65, fill: "#c23a2e" },
        { cx: 80, fill: "#3f8f4a" },
      ].map(({ cx, fill }) => (
        <circle key={cx} cx={cx} cy="83" r="7" fill={fill} stroke="#2e1f0f" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

// Demo-only stores: real preference persistence needs chrome.storage, which
// doesn't exist on a plain static page — an in-memory store keeps the
// theme/language toggles interactive for the length of a visit without
// throwing.
const demoThemeStore = new MemoryStore();
const demoNameLanguageStore = new MemoryStore();

export function DemoRoot() {
  const {
    cards,
    format,
    setFormat,
    zoneError,
    moveCard,
    setQuantity,
    setPrice,
    removeCard,
    reorderWithinGroup,
    clearCustomOrder,
  } = useDemoDeck();
  const { theme, setTheme } = useThemePreference(demoThemeStore);
  const { language: nameLanguage, setLanguage: setNameLanguage } = useNameLanguagePreference(demoNameLanguageStore);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupingAxis, setGroupingAxis] = useState<GroupingAxis>("type");
  const [sortAxis, setSortAxis] = useState<SortAxis>("cmc");
  const [sortNameLanguage, setSortNameLanguage] = useState<NameLanguage>(nameLanguage);
  const [draggedCard, setDraggedCard] = useState<DeckCard | undefined>();
  const [collapsedZones, setCollapsedZones] = useState<ReadonlySet<Zone>>(new Set());

  function toggleZoneCollapsed(zone: Zone) {
    setCollapsedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return next;
    });
  }

  const byZone = groupCardsByZone(cards);
  const budget = calculateBudget(cards);
  const cardCount = calculateCardCount(cards);
  const legality = checkLegality(cards, format);
  const hasCustomOrder = cards.some((c) => c.customOrder !== undefined);

  function handleDragStart(event: DragStartEvent) {
    setDraggedCard(event.active.data.current?.card as DeckCard | undefined);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedCard(undefined);
    const outcome = resolveDragOutcome(event, cards, groupingAxis, sortAxis, sortNameLanguage);
    if (outcome.kind === "move") {
      moveCard(outcome.cardId, outcome.toZone);
      setCollapsedZones((prev) => {
        if (!prev.has(outcome.toZone)) return prev;
        const next = new Set(prev);
        next.delete(outcome.toZone);
        return next;
      });
    } else if (outcome.kind === "reorder") {
      reorderWithinGroup(outcome.groupingAxis, outcome.groupKey, outcome.orderedCardIds);
    }
  }

  return (
    <div className="c500-tab">
      <header className="c500-tab__header">
        <LogoMark />
        <h1 className="c500-tab__title c500-visually-hidden">Montador de Decks Commander 500</h1>
        <select
          className="c500-tab__format-select"
          value={format}
          onChange={(e) => setFormat(e.target.value as Format)}
        >
          {Object.entries(FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="c500-tab__theme-toggle"
          aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          type="button"
          className="c500-tab__name-language-toggle"
          aria-label={
            nameLanguage === "en" ? "Mudar nomes das cartas para português" : "Mudar nomes das cartas para inglês"
          }
          title={
            nameLanguage === "en" ? "Mudar nomes das cartas para português" : "Mudar nomes das cartas para inglês"
          }
          onClick={() => setNameLanguage(nameLanguage === "en" ? "pt" : "en")}
        >
          {nameLanguage === "en" ? "PT" : "EN"}
        </button>
        <span className="c500-tab__unsynced">Live Demo</span>
      </header>

      <div className="c500-tab__body">
        <div className="c500-tab__ledger-tape">
          <BudgetGauge budget={budget} />
          <CardCountGauge cardCount={cardCount} />
          <LegalitySummary legality={legality} format={format} />
          <div className="c500-tab__view-toggle" role="group" aria-label="Modo de visualização">
            <span className="c500-tab__view-toggle-label">Visualização</span>
            <button
              type="button"
              aria-pressed={viewMode === "list"}
              aria-label="Ver em lista"
              title="Ver em lista"
              onClick={() => setViewMode("list")}
            >
              <ListIcon />
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "visual"}
              aria-label="Ver em modo visual"
              title="Ver em modo visual"
              onClick={() => setViewMode("visual")}
            >
              <GridIcon />
            </button>
          </div>
          <label className="c500-tab__grouping">
            Agrupar por
            <select value={groupingAxis} onChange={(e) => setGroupingAxis(e.target.value as GroupingAxis)}>
              {Object.entries(GROUPING_AXIS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="c500-tab__grouping">
            Ordenar por
            <select
              value={sortAxis}
              onChange={(e) => {
                const next = e.target.value as SortAxis;
                if (next !== sortAxis && hasCustomOrder) clearCustomOrder();
                setSortAxis(next);
                setSortNameLanguage(nameLanguage);
              }}
            >
              {Object.entries(SORT_AXIS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {((sortAxis === "name" && sortNameLanguage !== nameLanguage) || hasCustomOrder) && (
            <button
              type="button"
              className="c500-tab__resync-sort"
              title="Redefine a ordenação para o eixo ativo — descarta qualquer ordem manual e, se a ordenação for por Nome, resincroniza com o idioma atual"
              aria-label="Redefinir ordenação para o eixo ativo"
              onClick={() => {
                setSortNameLanguage(nameLanguage);
                if (hasCustomOrder) clearCustomOrder();
              }}
            >
              ↻
            </button>
          )}
          <ExportMenu cards={cards} />
        </div>

        <DndContext
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggedCard(undefined)}
        >
          <div className="c500-tab__main-row">
            <div className="c500-tab__hero-column">
              <div className="c500-tab__hero">
                <ZoneSection
                  zone="comandante"
                  cards={byZone.comandante}
                  error={zoneError?.zone === "comandante" ? zoneError.message : undefined}
                  illegalCardIds={legality.illegalCardIds}
                  isDeckOverBudget={budget.isOverCap}
                  hero
                  sortAxis={sortAxis}
                  sortNameLanguage={sortNameLanguage}
                  nameLanguage={nameLanguage}
                  onQuantityChange={setQuantity}
                  onPriceChange={setPrice}
                  collapsed={collapsedZones.has("comandante")}
                  onToggleCollapse={() => toggleZoneCollapsed("comandante")}
                />
                <ZoneSection
                  zone="comandanteParceiro"
                  cards={byZone.comandanteParceiro}
                  error={zoneError?.zone === "comandanteParceiro" ? zoneError.message : undefined}
                  illegalCardIds={legality.illegalCardIds}
                  isDeckOverBudget={budget.isOverCap}
                  hero
                  sortAxis={sortAxis}
                  sortNameLanguage={sortNameLanguage}
                  nameLanguage={nameLanguage}
                  onQuantityChange={setQuantity}
                  onRemoveCard={removeCard}
                  onPriceChange={setPrice}
                  collapsed={collapsedZones.has("comandanteParceiro")}
                  onToggleCollapse={() => toggleZoneCollapsed("comandanteParceiro")}
                />
              </div>
              <ZoneSection
                zone="maybeboard"
                cards={byZone.maybeboard}
                error={zoneError?.zone === "maybeboard" ? zoneError.message : undefined}
                illegalCardIds={legality.illegalCardIds}
                isDeckOverBudget={budget.isOverCap}
                viewMode={viewMode}
                groupingAxis={groupingAxis}
                sortAxis={sortAxis}
                sortNameLanguage={sortNameLanguage}
                nameLanguage={nameLanguage}
                filterable
                onQuantityChange={setQuantity}
                onRemoveCard={removeCard}
                onPriceChange={setPrice}
                collapsed={collapsedZones.has("maybeboard")}
                onToggleCollapse={() => toggleZoneCollapsed("maybeboard")}
              />
            </div>
            <ZoneSection
              zone="mainDeck"
              cards={byZone.mainDeck}
              error={zoneError?.zone === "mainDeck" ? zoneError.message : undefined}
              illegalCardIds={legality.illegalCardIds}
              isDeckOverBudget={budget.isOverCap}
              viewMode={viewMode}
              groupingAxis={groupingAxis}
              sortAxis={sortAxis}
              sortNameLanguage={sortNameLanguage}
              nameLanguage={nameLanguage}
              multiColumn
              filterable
              onQuantityChange={setQuantity}
              onRemoveCard={removeCard}
              onPriceChange={setPrice}
              collapsed={collapsedZones.has("mainDeck")}
              onToggleCollapse={() => toggleZoneCollapsed("mainDeck")}
            />
            <div className="c500-tab__analytics">
              <BarChart title="Curva de Mana" buckets={manaCurveBuckets(cards)} />
              <BarChart title="Cor" buckets={colorBuckets(cards)} />
              <BarChart title="Tipo" buckets={typeBuckets(cards)} />
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {draggedCard &&
              (viewMode === "visual" ? (
                <CardVisualTile card={draggedCard} nameLanguage={nameLanguage} dragOverlay className="c500-drag-overlay" />
              ) : (
                <CardRow card={draggedCard} nameLanguage={nameLanguage} dragOverlay className="c500-drag-overlay" />
              ))}
          </DragOverlay>
        </DndContext>
      </div>

      <footer className="c500-tab__footer">
        <a href="https://github.com/lucasfsanti/CMD500-Deck-Builder" target="_blank" rel="noreferrer">
          CMD500 Deck Builder no GitHub
        </a>
        <span className="c500-tab__footer-version">demonstração — deck real, capturado uma vez</span>
      </footer>
    </div>
  );
}
