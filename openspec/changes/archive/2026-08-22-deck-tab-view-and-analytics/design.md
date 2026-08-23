## Context

See proposal.md - Why for motivation. The extension currently mounts its entire UI (organizer, budget, legality, export) as a React tree inside a shadow DOM injected directly into the LigaMagic page (`content-script.tsx` → `PanelRoot`), reading captured deck data from the same document via `watchPage`/`parseDeckPage`/`parseCollectionPage` running in that same content-script context. This change moves the UI out of that document entirely, into a separate extension-hosted tab, which means the UI process and the capture process are no longer the same JS execution context and no longer share a DOM — they need an explicit relay.

The existing capture, organizer, budget, legality, and export logic (`src/lib/**`) is UI-framework-agnostic already (pure functions operating on `DeckCard[]`) and is reused unchanged; only the "where does the React tree mount, and how does it get data" layer changes.

## Goals / Non-Goals

**Goals:**
- Relay captured deck data from the content script (still the only thing with DOM access to the LigaMagic page) to an extension-hosted tab page, live, without the content script rendering anything.
- Keep each full-tab view correctly scoped to one source LigaMagic tab, including when the user has several deck tabs open at once, surviving background service-worker suspension (MV3 service workers are not always alive).
- Add card artwork (Visual view) and Main Deck charts (mana curve, color, type) as thin additions on top of the existing `DeckCard`/`CardEnrichment` model, not a parallel data model.

**Non-Goals:**
- Changing capture/parsing logic itself (`deck-page-parser.ts`, `collection-page-parser.ts`, `watch-deck-page.ts` internals are unchanged — only what consumes their output changes).
- Persisting the raw captured snapshot across browser restarts. It's relayed via `chrome.storage.session` (cleared at browser restart), matching its role as a live cache, not durable state. The format-preference persistence added in the previous change (`chrome.storage.local`, keyed by deck id) is untouched.
- A charting library. Charts are hand-rolled SVG, consistent with `BudgetGauge`'s existing approach and the project's hand-built design system, avoiding a new dependency for three bar charts.
- Backward compatibility with the in-page overlay. The proposal marks this **BREAKING** deliberately (user confirmed: full replacement).

## Decisions

### Relay path: content script → background → `chrome.storage.session`, read by the tab page via `storage.onChanged`
The content script keeps running `watchPage` exactly as before, but instead of feeding a local React tree, its `onCapture` callback now sends the result to the background service worker via `chrome.runtime.sendMessage`, tagged with nothing extra needed (the background reads `sender.tab.id` to know which source tab it came from). The background writes it into `chrome.storage.session`, keyed by that source tab's id. The tab-view page — itself a trusted extension context — reads its assigned source-tab-id (passed via its own URL, e.g. `tab.html?sourceTabId=123`) and both does an initial read and subscribes to `chrome.storage.session.onChanged` for live updates.

**Why not have the content script write to `chrome.storage.session` directly?** By default content scripts cannot access `chrome.storage.session` (it requires `setAccessLevel(TRUSTED_AND_UNTRUSTED_CONTEXTS)` from a trusted context first). Routing through the background avoids touching that access-level knob at all — the background is already a trusted context and was already the natural place for `card-data-service`'s Scryfall calls, so this keeps "who talks to the network/storage" in one place.

**Why session storage over runtime messaging (ports) alone?** A pure message-passing relay (background ↔ tab page over a `Port`) would not satisfy "full-tab view degrades gracefully if its source tab closes" or survive the tab page being opened *after* the content script's last capture — storage gives a durable-for-the-session, re-readable value; ports don't replay past messages to a newly-connected listener.

### Source-tab ↔ view-tab mapping lives in `chrome.storage.session`, not in-memory
A naive `Map<sourceTabId, viewTabId>` in the background service worker's module scope would be lost whenever Chrome suspends and later restarts the (event-driven, non-persistent) MV3 service worker. The mapping is instead stored in `chrome.storage.session` alongside the captured data. On an icon click, the background looks up any existing mapping for the active tab, confirms with `chrome.tabs.get` that the recorded view tab is still actually open (the user may have closed it directly), and only then decides to focus vs. create. `chrome.tabs.onRemoved` clears a mapping entry when its view tab closes.

### Content script becomes capture-only; the injected panel is deleted, not hidden
`content-script.tsx` no longer calls `createRoot`/mounts `PanelRoot` at all — that whole rendering path (`panel-root.tsx` as previously used, `use-deck.ts`'s DOM-watching variant) is replaced by a new tab-page entry point (`src/tab/`) with its own data-fetching hook that reads from the relay instead of a local DOM. The organizer/budget/legality/export **components** themselves (`ZoneSection`, `CardRow`, `BudgetGauge`, `LegalitySummary`, `ExportMenu`) are reused as-is inside the new tab page; only the hook that feeds them `cards`/`format`/etc. changes.

**Alternative considered**: keep the overlay mounted but visually hidden, purely as a capture host. Rejected — the content script doesn't need a React tree at all to run `watchPage`; keeping one around would just be dead rendering cost and a second place UI bugs could hide.

### Card artwork: extend `CardEnrichment` with `imageUrl`, sourced from Scryfall, with the double-faced-card fallback handled once
Scryfall's card object exposes `image_uris.normal` directly for single-faced cards, but for double-faced/split-style layouts the image lives under `card_faces[0].image_uris.normal` instead — there is no top-level `image_uris` for those. `toEnrichment()` in `client.ts` resolves `imageUrl` with that fallback once, so every consumer (`CardVisualTile`, and anything else that wants art later) gets a single flat field and never has to know about Scryfall's card-face shape.

### Charts: hand-rolled SVG bar charts over `DeckCard[]`, computed the same way budget/legality are
Each of the three charts (mana curve, color distribution, type distribution) is a pure function `DeckCard[] → { bucket: string; count: number }[]`, reusing the exact grouping conventions `group-sort.ts` already established (color-identity ordering, primary-type extraction) so a card's bucket in a chart always matches the group it renders under in List/Visual view. Rendered as simple SVG bar charts styled with the existing `--c500-*` CSS custom properties. The `dataviz` skill should be consulted during implementation for the actual visual polish (bar spacing, labels, accessibility) — this decision only fixes the approach (hand-rolled SVG, no library, one shared bucket-counting utility), not the pixel-level design.

## Risks / Trade-offs

- **[Risk] Losing the "at a glance while scrolling the LigaMagic page" affordance the overlay gave.** → Mitigation: none needed — this is the explicitly chosen, user-confirmed trade-off (full replacement), not an oversight.
- **[Risk] MV3 service-worker suspension losing relay state mid-flight.** → Mitigation: both the captured data and the tab-mapping live in `chrome.storage.session`, not service-worker memory, so a suspend/restart cycle loses nothing observable.
- **[Risk] A source tab reloading while its view tab is open could, in principle, cause overlapping writes.** → Mitigation: not a real race in practice — `watchPage` already coalesces mutation bursts into a single re-parse, and each capture write is a full overwrite of that source tab's session-storage entry, so it's naturally last-write-wins with no partial state.
- **[Risk] Scryfall's double-faced-card image shape being handled inconsistently if a second call site re-implements the fallback.** → Mitigation: resolved once in `toEnrichment()`, never re-derived downstream.

## Migration Plan

No production users exist yet (the extension has not been published), so there is no live-user migration path to design. Rollout is: implement, rebuild, reload the unpacked extension, verify against the live LigaMagic site as in the previous change. The manifest changes (`action`, new tab page) take effect on the next `chrome://extensions` reload with no data migration involved.

## Open Questions

- Exact bar-chart visual treatment (colors beyond the existing palette, label density, hover/tooltip behavior) is left to implementation time via the `dataviz` skill — it doesn't change this change's specs, approach, or task breakdown.
