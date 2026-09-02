import { useState } from "react";
import { DndContext, DragOverlay, pointerWithin, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { DeckCard, Format, Zone } from "../lib/deck/types";
import type { NameLanguage } from "../lib/deck/display-name";
import { groupCardsByZone, type GroupingAxis, type SortAxis } from "../lib/organizer/group-sort";
import { resolveDragOutcome } from "../lib/organizer/resolve-drop";
import { calculateBudget } from "../lib/budget/calculate-budget";
import { calculateCardCount } from "../lib/organizer/calculate-card-count";
import { checkLegality } from "../lib/legality/check-legality";
import { ZoneSection, type ViewMode } from "../ui/components/ZoneSection";
import { BudgetGauge } from "../ui/components/BudgetGauge";
import { CardCountGauge } from "../ui/components/CardCountGauge";
import { LegalitySummary } from "../ui/components/LegalitySummary";
import { ExportMenu } from "../ui/components/ExportMenu";
import { BarChart } from "../ui/components/charts/BarChart";
import { CardRow } from "../ui/components/CardRow";
import { CardVisualTile } from "../ui/components/CardVisualTile";
import { manaCurveBuckets, colorBuckets, typeBuckets } from "../lib/analytics/bucket-counts";
import { useTabDeck } from "./use-tab-deck";
import { useSourceTabStatus } from "./use-source-tab-status";
import { useThemePreference } from "./use-theme-preference";
import { useNameLanguagePreference } from "./use-name-language-preference";
import { getSourceTabIdFromUrl, getDeckIdFromUrl } from "./use-relayed-capture";

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

/**
 * View-toggle icons (task 7.2): the buttons lost their visible "Lista"/
 * "Visual" text, so each button now carries its accessible name via
 * aria-label instead. fill="currentColor" lets the existing
 * button[aria-pressed="true"] color rule recolor the icon for free.
 */
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

/**
 * Theme toggle icons (panel-theming task 3.1): each shows the theme the
 * button would switch *to*, following the same icon-button-with-aria-label
 * pattern as ListIcon/GridIcon above.
 */
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

/**
 * Header logo mark (task 1.1, revised): a simplified vector redraw of the
 * extension's real logo (extension/public/icons/icon128.png) — the gold
 * badge, dark-brown outline, blue monogram, and WUBRG dot row are all
 * carried over, but the two-line "CMD500 Deckbuilder" script wordmark is
 * reduced to a single bold "5" and the dots lose their glossy highlight.
 * Downscaling the full raster logo to ~38px left the wordmark illegible;
 * being vector, this stays crisp at any size instead of just being smaller.
 */
function LogoMark() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 100 100"
      className="c500-tab__mark"
      aria-hidden="true"
    >
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

/**
 * `chrome` is an ambient global from @types/chrome, not always defined at
 * runtime (e.g. this component's test environment) — guard both the
 * identifier itself and the call chain rather than assuming either exists.
 */
function getExtensionVersion(): string | undefined {
  if (typeof chrome === "undefined") return undefined;
  try {
    return chrome.runtime?.getManifest?.()?.version;
  } catch {
    return undefined;
  }
}

export function TabRoot() {
  const url = new URL(window.location.href);
  const sourceTabId = getSourceTabIdFromUrl(url);
  const deckId = getDeckIdFromUrl(url);

  const {
    cards,
    pageStatus,
    format,
    setFormat,
    zoneError,
    moveCard,
    setQuantity,
    setPrice,
    removeCard,
    reorderWithinGroup,
    clearCustomOrder,
  } = useTabDeck(sourceTabId, deckId);
  const sourceStatus = useSourceTabStatus(sourceTabId);
  const { theme, setTheme } = useThemePreference();
  const { language: nameLanguage, setLanguage: setNameLanguage } = useNameLanguagePreference();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupingAxis, setGroupingAxis] = useState<GroupingAxis>("type");
  const [sortAxis, setSortAxis] = useState<SortAxis>("cmc");
  // Snapshot of nameLanguage taken when the user (re)selects the Name sort
  // axis — deliberately not the live nameLanguage itself, so flipping the
  // display-language toggle afterward doesn't silently re-sort an
  // already-Name-sorted zone (deck-organizer spec).
  const [sortNameLanguage, setSortNameLanguage] = useState<NameLanguage>(nameLanguage);
  const [draggedCard, setDraggedCard] = useState<DeckCard | undefined>();
  // Per-zone collapse/expand (zone-collapse-toggle): session-only, like
  // viewMode/groupingAxis/sortAxis above — never persisted, always starts
  // with every zone expanded. Lifted here (rather than local to
  // ZoneSection, unlike its per-zone filter text) so handleDragEnd can
  // force a specific zone open when a card is dropped into it.
  const [collapsedZones, setCollapsedZones] = useState<ReadonlySet<Zone>>(new Set());
  const version = getExtensionVersion();

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
      // A drop into a collapsed zone still moves the card there — expand
      // it so the result is visible (zone-collapse-toggle).
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
            nameLanguage === "en"
              ? "Mudar nomes das cartas para português"
              : "Mudar nomes das cartas para inglês"
          }
          title={
            nameLanguage === "en"
              ? "Mudar nomes das cartas para português"
              : "Mudar nomes das cartas para inglês"
          }
          onClick={() => setNameLanguage(nameLanguage === "en" ? "pt" : "en")}
        >
          {nameLanguage === "en" ? "PT" : "EN"}
        </button>
        {sourceStatus === "closed" && (
          <span className="c500-tab__unsynced">
            Não sincronizado — a aba de origem do LigaMagic foi fechada
          </span>
        )}
      </header>

      {pageStatus === "reading" && <p className="c500-tab__status">Lendo este deck…</p>}
      {pageStatus === "unrecognized-page" && (
        <p className="c500-tab__status">
          Não foi possível ler esta página. O LigaMagic pode ter mudado o layout.
        </p>
      )}

      {pageStatus === "ok" && (
        <div className="c500-tab__body">
          {/* Ledger tape (signature element, part 1): budget, card count,
              legality, view/grouping controls, and export fused into one
              full-width strip — see proposal.md and design.md. */}
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
            <label className="c500-tab__grouping">
              Ordenar por
              <select
                value={sortAxis}
                onChange={(e) => {
                  const next = e.target.value as SortAxis;
                  // A genuine axis change (not the same value re-fired) is
                  // itself an explicit "sort by this" signal, so it clears
                  // any manual custom order the same way the generalized
                  // resync button below does (custom-group-order). Gated on
                  // hasCustomOrder so an ordinary sort-axis change — the vast
                  // majority of the time, with nothing to clear — never
                  // marks hasLocalEdits and so never disconnects the tab
                  // from future re-syncs with the source page.
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
                  // Only when there's actually a custom order to clear —
                  // otherwise a pure Name-axis language resync (nothing to
                  // do with custom order) would needlessly mark hasLocalEdits.
                  if (hasCustomOrder) clearCustomOrder();
                }}
              >
                ↻
              </button>
            )}
            <ExportMenu cards={cards} />
          </div>

          <DndContext
            // pointerWithin (unchanged by custom-group-order) already prefers
            // the innermost match when the pointer is over both a card's
            // droppable and its enclosing zone's: it sorts collisions by
            // average distance from the pointer to each rect's four corners,
            // and a small nested rect's corners are always closer to an
            // interior point than the far-larger enclosing rect's corners
            // are — so a drop precisely on a card resolves to that card
            // (enabling reorder), while a drop in a zone's empty space
            // (no card rect contains the pointer) falls back to the zone.
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDraggedCard(undefined)}
          >
            {/* Main content row: Commander hero, with Companheiro stacked
                beneath it and Maybeboard beneath that, beside Deck Principal
                (visible without scrolling) and the analytics column. */}
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
                    // The commander isn't removable via this control — see
                    // deck-organizer's "Explicit card removal" delta. A
                    // replacement is set by dragging the current card out to
                    // another zone, then dragging the intended commander in.
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
                  <CardVisualTile
                    card={draggedCard}
                    nameLanguage={nameLanguage}
                    dragOverlay
                    className="c500-drag-overlay"
                  />
                ) : (
                  <CardRow
                    card={draggedCard}
                    nameLanguage={nameLanguage}
                    dragOverlay
                    className="c500-drag-overlay"
                  />
                ))}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <footer className="c500-tab__footer">
        <a href="https://github.com/lucasfsanti" target="_blank" rel="noreferrer">
          Feito por Lucas Santiago
        </a>
        {version && <span className="c500-tab__footer-version">v{version}</span>}
      </footer>
    </div>
  );
}
