## 1. Relay infrastructure

- [x] 1.1 Implement a background message handler that receives a capture result from the content script and writes it to `chrome.storage.session`, keyed by the sender tab's id, and verify a unit test confirms the write
- [x] 1.2 Update the content script to stop mounting any UI and instead call `watchPage`/`parseDeckPage`/`parseCollectionPage` as before, posting each capture result to the background via `chrome.runtime.sendMessage`, and verify a unit test confirms captures are sent, not rendered
- [x] 1.3 Implement source-tab-id ↔ view-tab-id mapping helpers backed by `chrome.storage.session` (get/set/clear), and verify unit tests cover: no existing mapping, an existing mapping whose tab is still open, and an existing mapping whose tab has been closed
- [x] 1.4 Wire a `chrome.tabs.onRemoved` listener to clear a closed view tab's mapping entry, and verify a unit test against a mocked `chrome.tabs` API

## 2. Toolbar icon and tab page scaffolding

- [x] 2.1 Add an `action` entry to `manifest.json` and verify the extension loads unpacked with a toolbar icon present and no console errors
- [x] 2.2 Implement the `chrome.action.onClicked` handler: no-op when the active tab isn't a LigaMagic deck/collection page (per `detectLigaMagicPage`), otherwise look up/create/focus the view tab using the 1.3 mapping helpers, and verify unit tests cover all three branches
- [x] 2.3 Create the tab-view HTML shell and a new esbuild entry point bundled by `scripts/build.mjs`, and verify the build produces the new HTML and JS output with no errors
- [x] 2.4 Implement a data-source hook for the tab page that reads its source-tab-id from its own URL, does an initial `chrome.storage.session` read, and subscribes to `storage.session.onChanged` for live updates, and verify unit tests cover the initial read and a live update after a storage change event
- [x] 2.5 Wire format persistence (reusing `format-storage.ts`) and local move/quantity-edit state (reusing `deck-state.ts`) into the new hook, and verify unit tests mirror the previous change's coverage for format load/persist, move, and quantity edit against the new hook

## 3. Full-tab view UI

- [x] 3.1 Build the tab page's root component, reusing `BudgetGauge`, `LegalitySummary`, `ExportMenu`, and the five `ZoneSection`s at full width, and verify it renders correctly against a captured-deck fixture in a component test
- [x] 3.2 Implement the "no longer synced" indicator shown when the source tab has closed, per `deck-tab-view`'s degrade-gracefully requirement, and verify a component test covers the synced-to-unsynced transition

## 4. Visual view

- [x] 4.1 Extend `CardEnrichment` with `imageUrl` and resolve it in `toEnrichment()`, falling back to `card_faces[0].image_uris.normal` for double-faced cards when there's no top-level `image_uris`, and verify unit tests cover both a single-faced and a double-faced card fixture
- [x] 4.2 Build a `CardVisualTile` component (artwork, name caption, quantity, price) reusing the same illegal/over-budget marker classes as `CardRow`, and verify a component test covers rendering with resolved artwork
- [x] 4.3 Implement the placeholder-tile fallback for unresolved artwork, and verify a component test covers unavailable and not-found enrichment status
- [x] 4.4 Implement the List/Visual view-mode toggle and wire `ZoneSection` to render `CardRow` or `CardVisualTile` per the active mode, and verify a component test covers switching modes and that drag-and-drop/quantity-edit handlers still work in Visual mode

## 5. Deck analytics

- [x] 5.1 Implement a shared bucket-counting utility for mana curve, color, and type, reusing `group-sort.ts`'s grouping conventions, and verify unit tests cover quantity-weighted counting (not unique-card counting), per the spec's explicit scenario
- [x] 5.2 Implement the mana-curve, color-distribution, and type-distribution SVG bar chart components, and verify component tests cover rendering against a fixture deck (one reusable `BarChart` component instantiated per chart, per dataviz skill guidance: single-series magnitude charts use one consistent hue, not a categorical palette)
- [x] 5.3 Scope all three charts to Main Deck only, and verify a unit test confirms cards in other zones are excluded
- [x] 5.4 Wire the charts into the tab page so they recompute on every `cards` state change, and verify a component test confirms a drag-and-drop move into Main Deck updates all three charts within the same update (verified at the reactive-pipeline level via `useTabDeck`, since jsdom's zero-valued `getBoundingClientRect()` makes a real dnd-kit drag gesture unsimulatable in a unit test — same constraint as the previous change; the actual drag gesture is verified live in group 7)

## 6. Cleanup and docs

- [x] 6.1 Remove the now-unused injected-panel code path (the old in-page `panel-root.tsx`/`use-deck.ts` rendering flow superseded by groups 1-3) and verify the full test suite still passes with no dangling references
- [x] 6.2 Update `extension/README.md` to describe the toolbar-icon-triggered tab view in place of the injected panel, and document any new `verify-*.mjs` scripts this change adds, and verify the doc matches the new build output
- [x] 6.3 Run the full test suite, typecheck, and build, and verify all three are clean

## 7. End-to-end verification

- [x] 7.1 Verify live against the real LigaMagic site: clicking the toolbar icon on a real deck page opens a tab scoped to that deck, and no overlay appears on the source page (verified via `verify-tab-view.mjs`: no overlay injected, tab view loads scoped to the real deck by `sourceTabId`/`deckId`)
- [x] 7.2 Verify live that clicking the toolbar icon again for the same source tab focuses the existing view tab instead of opening a duplicate (Chromium's toolbar icon click cannot be triggered by browser automation — confirmed not even via a bound keyboard shortcut, since Chrome dispatches extension-command accelerators at the browser-chrome level below CDP-injectable input. `verify-tab-view-lifecycle.mjs` instead confirms live, against the real `chrome.storage.session`/`chrome.tabs` APIs, that the dedup lookup `handleActionClicked` performs resolves an existing mapping to the still-open tab; the click-dispatch branch itself is exhaustively unit-tested in `service-worker.test.ts` per task 2.2)
- [x] 7.3 Verify live that closing the source tab leaves the view tab showing its last captured state with the unsynced indicator visible (verified via `verify-tab-view-lifecycle.mjs`: closing the real source tab fires a genuine `chrome.tabs.onRemoved`; the view tab keeps showing its last-known zones and displays "Not synced — the source LigaMagic tab was closed")
- [x] 7.4 Verify live that switching to Visual view on a real deck renders card artwork (verified via `verify-tab-view.mjs`: 22 resolved artwork tiles against a real deck)
- [x] 7.5 Verify live that all three charts render with plausible values against a real deck (verified via `verify-tab-view.mjs`: Mana Curve/Color/Type charts rendered with correct proportional bar fills and real counts; caught and fixed a real `:host`-only CSS custom-property bug along the way — see design.md/session notes)
