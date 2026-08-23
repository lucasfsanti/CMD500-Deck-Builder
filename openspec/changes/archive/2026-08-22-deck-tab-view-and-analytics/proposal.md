## Why

The current injected side panel is a fixed-width overlay (320px) on top of LigaMagic's own busy page, which leaves little room to browse card art or read charts alongside the zone lists. Moving the deckbuilder into its own full browser tab gives it the space to add a visual, image-based card view and deck analytics (mana curve, color/type distribution) that wouldn't fit — or would fight LigaMagic's own layout — inside the current overlay.

## What Changes

- **BREAKING**: The extension no longer injects an overlay panel into the LigaMagic page. Clicking the extension's toolbar icon while a LigaMagic deck or collection page is active opens a new browser tab hosting the full deckbuilder UI instead.
- The content script's role narrows to capture-and-relay only: it still parses the page and watches for changes (unchanged from today), but no longer renders any UI on the page itself.
- The full-tab view hosts the existing organizer, budget gauge, legality summary, and export menu (unchanged in behavior), now with room to add:
  - A view-mode toggle between the current List view (name/qty/price rows) and a new Visual view showing each card's artwork (from Scryfall) with quantity/price.
  - A deck analytics section for the Main Deck zone: a mana curve chart (card count by converted mana cost), a color-distribution chart, and a type-distribution chart.
- Multiple LigaMagic deck tabs can each have their own full-tab view open at once, each scoped to its own source deck.

## Capabilities

### New Capabilities
- `deck-tab-view`: Opens and hosts the full deckbuilder experience in a dedicated browser tab (toolbar-icon trigger, per-source-deck scoping, relaying captured data from the content script that used to render its own UI in-page).
- `card-visual-view`: A view-mode toggle that displays cards as artwork thumbnails instead of name-only rows, without losing any existing per-card functionality (drag-and-drop, quantity edit, legality/budget markers).
- `deck-analytics`: Mana curve, color-distribution, and type-distribution charts scoped to the Main Deck zone, updating live as the deck changes.

### Modified Capabilities
- `deck-page-capture`: The activation requirement changes from "activates and injects its UI into the page" to "activates and captures/relays data, with no UI injected into the page" — capture and change-detection behavior itself is unchanged.

## Impact

- `extension/src/content/content-script.tsx` and `panel-root.tsx`: content script stops mounting a React panel into a shadow DOM; instead becomes a data source the background service worker and the new tab page can query/relay from.
- `extension/src/background/service-worker.ts`: gains a `chrome.action.onClicked` handler that opens (or focuses) a tab-view page scoped to the active LigaMagic tab, and message routing to relay captured deck data between the source tab and the tab-view page.
- New extension-hosted page (e.g. `tab.html` + its own entry bundle) reusing the existing organizer/budget/legality/export/UI components at full width.
- `manifest.json`: needs a declared browser action (toolbar icon click target) and a web-accessible/extension page for the new tab.
- Card artwork requires Scryfall's image data, extending what `card-data-service`'s existing enrichment lookup already fetches per card (no new external dependency).
