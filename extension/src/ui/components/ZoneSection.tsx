import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DeckCard, Zone } from "../../lib/deck/types";
import {
  groupAndSortZone,
  TYPE_DISPLAY_LABELS,
  COLOR_GROUP_DISPLAY_LABELS,
  type GroupingAxis,
  type SortAxis,
} from "../../lib/organizer/group-sort";
import { isBudgetCounted } from "../../lib/budget/calculate-budget";
import type { NameLanguage } from "../../lib/deck/display-name";
import { CardRow } from "./CardRow";
import { CardVisualTile } from "./CardVisualTile";

/**
 * Translates a group's English classification key (from group-sort.ts) to
 * its Portuguese display label. Mana Cost groups are numeric (or "?" for
 * unresolved) and need no translation.
 */
function groupDisplayLabel(axis: GroupingAxis, type: string): string {
  if (axis === "type") return TYPE_DISPLAY_LABELS[type as keyof typeof TYPE_DISPLAY_LABELS] ?? type;
  if (axis === "color") return COLOR_GROUP_DISPLAY_LABELS[type] ?? type;
  return type;
}

/** Points down when expanded, right when collapsed — per zone-collapse-toggle. */
function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      style={{ transform: collapsed ? "rotate(-90deg)" : undefined }}
    >
      <path
        d="M1 3 L5 7 L9 3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type ViewMode = "list" | "visual";

// "Comandante" and "Maybeboard" are kept exactly as LigaMagic's own page
// shows them (see zone-labels.ts); "Main Deck" and "Companheiro" are this
// app's own display labels (LigaMagic's page has no header for the former,
// and the latter is shortened from LigaMagic's "Comandante Parceiro" for a
// cleaner hero-column caption) — the underlying zone id (`comandanteParceiro`)
// is unchanged, only its rendered label.
const ZONE_LABELS: Record<Zone, string> = {
  comandante: "Comandante",
  comandanteParceiro: "Companheiro",
  mainDeck: "Main Deck",
  maybeboard: "Maybeboard",
};

export interface ZoneSectionProps {
  zone: Zone;
  cards: DeckCard[];
  error?: string;
  illegalCardIds?: ReadonlySet<string>;
  isDeckOverBudget?: boolean;
  viewMode?: ViewMode;
  groupingAxis?: GroupingAxis;
  sortAxis?: SortAxis;
  /** Active card-name display language, per card-name-language's spec. Defaults to English. */
  nameLanguage?: NameLanguage;
  /**
   * The name-language snapshot to sort by when `sortAxis` is "name" —
   * distinct from `nameLanguage` (which only affects display): per
   * deck-organizer's spec, the Name axis's order is frozen to whatever
   * language was active when the user (re)selected it, not the live
   * toggle. The caller (TabRoot) owns taking that snapshot. Defaults to
   * English.
   */
  sortNameLanguage?: NameLanguage;
  onQuantityChange?: (cardId: string, quantity: number) => void;
  onRemoveCard?: (cardId: string) => void;
  onPriceChange?: (cardId: string, price: number | undefined) => void;
  /**
   * Renders this zone in TabRoot's Commander hero block instead of a normal
   * list/grid zone: forces Visual-mode tiles at hero size regardless of the
   * global view toggle, and drops the type/color/cmc group label (redundant
   * once a zone holds only the one or two commander cards). Everything else
   * — drag-and-drop, grouping, error display — is unchanged.
   */
  hero?: boolean;
  /**
   * Deck Principal's List view only: lays out each group in its own CSS
   * multi-column flow (Moxfield-style) instead of stacking groups in one
   * long vertical list. Ignored in Visual mode, which already wraps tiles
   * into a grid. Maybeboard's narrower column doesn't get this — not enough
   * width for multiple side-by-side groups.
   */
  multiColumn?: boolean;
  /**
   * Adds an independent name-filter control to this zone's header (per
   * deck-organizer's "Per-zone name filter" delta). Not lifted to TabRoot —
   * nothing outside this zone's own render needs its filter text, since
   * budget/card count/legality are computed elsewhere from the full,
   * unfiltered card list regardless of what any zone chooses to display.
   * Set only on Main Deck and Maybeboard; the hero zones never get it.
   */
  filterable?: boolean;
  /**
   * Whether this zone's card list (and filter, if any) is hidden per
   * deck-organizer's zone-collapse-toggle requirement. Owned by TabRoot,
   * not this component — unlike the per-zone filter text — since
   * auto-expand-on-drop needs to flip a specific zone's state from
   * outside (see design.md). Defaults to expanded.
   */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ZoneSection({
  zone,
  cards,
  error,
  illegalCardIds,
  isDeckOverBudget,
  viewMode = "list",
  groupingAxis = "type",
  sortAxis = "cmc",
  nameLanguage = "en",
  sortNameLanguage = "en",
  onQuantityChange,
  onRemoveCard,
  onPriceChange,
  hero = false,
  multiColumn = false,
  filterable = false,
  collapsed = false,
  onToggleCollapse,
}: ZoneSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const [filterText, setFilterText] = useState("");
  const effectiveViewMode = hero ? "visual" : viewMode;
  const trimmedFilter = filterText.trim().toLowerCase();
  const visibleCards =
    filterable && trimmedFilter
      ? cards.filter(
          (c) =>
            c.name.toLowerCase().includes(trimmedFilter) ||
            (c.pageNamePt?.toLowerCase().includes(trimmedFilter) ?? false),
        )
      : cards;
  const groups = groupAndSortZone(visibleCards, groupingAxis, sortAxis, sortNameLanguage);
  const cardCount = visibleCards.reduce((sum, c) => sum + c.quantity, 0);
  // A hero zone with no card (typically Companheiro when there's no partner
  // commander) collapses to a slim hint instead of reserving full hero-art
  // height — see design.md's "shrink when there is no card" decision.
  const heroEmpty = hero && cards.length === 0;

  return (
    <section className={`c500-zone${hero ? " c500-zone--hero" : ""}${heroEmpty ? " c500-zone--hero-empty" : ""}${collapsed ? " c500-zone--collapsed" : ""}`}>
      <div className="c500-zone__header">
        {ZONE_LABELS[zone]}
        <span className="c500-zone__count">({cardCount})</span>
        {onToggleCollapse && (
          <button
            type="button"
            className="c500-zone__toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `expandir ${ZONE_LABELS[zone]}` : `recolher ${ZONE_LABELS[zone]}`}
            title={collapsed ? `Expandir ${ZONE_LABELS[zone]}` : `Recolher ${ZONE_LABELS[zone]}`}
            onClick={onToggleCollapse}
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}
        {filterable && !collapsed && (
          <input
            type="text"
            className="c500-zone__filter"
            placeholder="Filtrar por nome…"
            aria-label={`filtrar ${ZONE_LABELS[zone]} por nome`}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        )}
      </div>
      {error && <div className="c500-zone__error">{error}</div>}
      <div
        ref={setNodeRef}
        className={`c500-zone__dropzone${isOver ? " c500-zone__dropzone--active" : ""}${effectiveViewMode === "visual" ? " c500-zone__dropzone--visual" : ""}${multiColumn && effectiveViewMode === "list" ? " c500-zone__dropzone--columns" : ""}${collapsed ? " c500-zone__dropzone--collapsed" : ""}`}
      >
        {!collapsed && groups.map((group) => (
          <div key={group.type}>
            {!hero && (
              <div className="c500-group__label">
                {groupDisplayLabel(groupingAxis, group.type)}
                <span className="c500-group__count">
                  ({group.cards.reduce((sum, c) => sum + c.quantity, 0)})
                </span>
              </div>
            )}
            {/* One SortableContext per group (not per zone): a drag can only ever
                reorder within the group it started in — group membership is
                intrinsic to a card (type/color/cmc), so cards from different
                groups are never part of the same sortable list (custom-group-order). */}
            <SortableContext
              items={group.cards.map((c) => c.id)}
              strategy={effectiveViewMode === "visual" ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div className={effectiveViewMode === "visual" ? "c500-tile-grid" : undefined}>
                {group.cards.map((card) =>
                  effectiveViewMode === "visual" ? (
                    <CardVisualTile
                      key={card.id}
                      card={card}
                      size={hero ? "hero" : "default"}
                      illegal={illegalCardIds?.has(card.id)}
                      overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                      nameLanguage={nameLanguage}
                      onQuantityChange={onQuantityChange}
                      onRemove={onRemoveCard}
                      onPriceChange={onPriceChange}
                    />
                  ) : (
                    <CardRow
                      key={card.id}
                      card={card}
                      illegal={illegalCardIds?.has(card.id)}
                      overBudget={Boolean(isDeckOverBudget) && isBudgetCounted(card)}
                      nameLanguage={nameLanguage}
                      onQuantityChange={onQuantityChange}
                      onRemove={onRemoveCard}
                      onPriceChange={onPriceChange}
                    />
                  ),
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </section>
  );
}
