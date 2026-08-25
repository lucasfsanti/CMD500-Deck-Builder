## Why

The deckbuilder's users are exclusively Brazilian LigaMagic players, but its UI and docs are English-only, its drag-and-drop gives no visual feedback and mis-targets drop zones when a card is grabbed off-center, it carries a Sideboard zone the format doesn't use, List view has no quick way to see a card's art, and nothing warns when a deck exceeds Commander's 99-card limit.

## What Changes

- Translate all user-facing UI text to Brazilian Portuguese, and both `README.md` and `extension/README.md`, in full — card names stay as captured (Scryfall/LigaMagic naming), untranslated. Hardcoded strings, no locale-switching layer, since there is no non-Portuguese audience to switch back for.
- Add drag visual feedback: a semi-transparent ghost tile follows the cursor while dragging, anchored to the exact point the card was grabbed. **BREAKING** (behavioral): replaces the current "dims in place with no ghost" drag behavior.
- Fix drop-zone targeting so it resolves against the actual cursor position rather than the dragged card's translated bounding-box center — this is what caused Visual-mode drops to feel off when a tall tile was grabbed away from its center.
- Remove the Sideboard zone. **BREAKING**: cards LigaMagic reports under a Sideboard header are now captured straight into Maybeboard instead of their own zone; the zone no longer appears in the UI, in either export format, or in the underlying `Zone` type.
- Add an artwork hover preview to List view: hovering a row shows a floating tooltip with that card's art near the cursor, mirroring LigaMagic's own hover-preview convention.
- Add a live 99-card limit warning, scoped to the same zones budget already counts (Main Deck + Comandante Parceiro), with visual feedback in the same style as the existing over-budget indicator.

## Capabilities

### New Capabilities
- `localization`: All user-facing UI text and both project READMEs render in Brazilian Portuguese; captured card names are excluded and stay untranslated.
- `deck-size-limit`: Live-recomputed warning when the deck's card count (Main Deck + Comandante Parceiro) exceeds the 99-card Commander limit, mirroring budget-tracking's over-cap visual treatment.

### Modified Capabilities
- `deck-organizer`: "Five deck zones" becomes four (Sideboard removed, folded into Maybeboard); new requirement for drag visual feedback — a cursor-following ghost with transparency, and drop-target resolution anchored to the pointer rather than the dragged element's translated rect.
- `deck-page-capture`: initial capture no longer recognizes Sideboard as a distinct zone; cards under a Sideboard header on the page are captured into Maybeboard.
- `deck-export`: both export formats (LigaMagic-import and readable) drop the separate Sideboard block; those cards now appear in the Maybeboard block.
- `budget-tracking`: requirement wording no longer lists Sideboard as a distinct zone excluded from the budget total (folded into Maybeboard).
- `deck-analytics`: requirement wording no longer lists Sideboard as a distinct zone excluded from the charts.
- `format-legality`: the Duel Commander cross-zone illegal-card scenario no longer references Sideboard as a separate zone.
- `card-visual-view`: new requirement for the List-mode artwork hover preview (this capability already owns artwork-display concerns).

## Impact

- **Code**: `extension/src/lib/deck/types.ts` (`ZONES`/`Zone`), `extension/src/lib/capture/zone-labels.ts` and `deck-page-parser.ts`, `extension/src/lib/organizer/resolve-drop.ts` and `deck-state.ts`, `extension/src/lib/export/generate-decklist.ts`, `extension/src/lib/budget/calculate-budget.ts` (comment only), `extension/src/lib/analytics/bucket-counts.ts`, `extension/src/ui/components/ZoneSection.tsx`, `CardRow.tsx`, `CardVisualTile.tsx`, `BudgetGauge.tsx`, `LegalitySummary.tsx`, `ExportMenu.tsx`, `charts/BarChart.tsx`, `extension/src/tab/TabRoot.tsx`, `extension/src/ui/panel.css`.
- **New code**: a drag `DragOverlay` + pointer-anchored collision detection in `TabRoot.tsx`; a hover-preview component for List view; a card-count check alongside `calculate-budget.ts`.
- **Docs**: `README.md`, `extension/README.md` — full translation.
- **Tests**: existing suites asserting English strings, the five-zone model, and Sideboard-specific behavior (`deck-state.test.ts`, `resolve-drop.test.ts`, `generate-decklist.test.ts`, `deck-page-parser.test.ts`, component tests) need updating alongside the code.
- **No backend, no new dependencies** — all five items are extension-local UI/behavior changes.
