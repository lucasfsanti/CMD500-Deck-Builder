# Commander 500 Deckbuilder

A browser extension that adds budget tracking and format-legality checking to LigaMagic deck pages, for the Brazilian Commander 500 and Commander 500 Duel formats.

## What it does

- Reads the currently open LigaMagic deck page directly from its HTML (no LigaMagic account or API access required) — commander(s), main deck, sideboard, maybeboard, and each card's lowest listed price.
- Enriches captured cards with type/color/CMC data by calling [Scryfall's public API](https://scryfall.com/docs/api) directly from the browser — no backend of ours involved.
- Computes the deck's Commander 500 budget (lowest price across non-commander, non-basic-land cards) against the R$500 cap, with live visual feedback.
- Checks every card against the active format's banlist: Commander 500 reads Scryfall's own Commander legality data live; Commander 500 Duel reads a dataset bundled with the extension (curated from [duelcommander.org](https://www.duelcommander.org/banlist/), since that format has no public API).
- Lets you drag cards between zones, edit quantities, and export the deck as plain text — either in the exact format LigaMagic's own import/export uses, or a human-readable, zone-labeled version.

## Requirements

- Node.js 18+ and npm.
- Google Chrome (or another Chromium-based browser) to load the unpacked extension.

## Setup

```bash
npm install
npm run build
```

This produces `dist/`, containing the unpacked extension (`manifest.json`, `background.js`, `content.js`, icons).

## Loading the extension in Chrome

1. Run `npm run build` (or `node scripts/build.mjs --watch` while developing).
2. Open `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select this project's `dist/` directory.
5. Open a LigaMagic deck page (`https://www.ligamagic.com.br/?view=dks/deck&id=<n>`) or collection page — the panel appears fixed in the top-right corner.

Re-run `npm run build` after any source change and click the reload icon on the extension's card in `chrome://extensions` to pick it up.

## Running tests

```bash
npm test          # run once
npm run test:watch
npm run typecheck
```

Tests are unit/component-level (Vitest + jsdom) and run against fixtures in `test/fixtures/`, not the live network — no Scryfall or LigaMagic access is required to run the suite.

## Manual browser verification

`scripts/verify-*.mjs` are standalone Playwright scripts used during development to check the extension against the **real, live LigaMagic site** (extension load, panel injection, drag-and-drop, budget/legality display, export). They are not part of `npm test` and are not required for normal development, but are useful when changing anything that touches page-scraping, Scryfall calls, or the injected UI.

To use them, Playwright needs to be present (deliberately not a permanent dependency, since it bundles a full Chromium download):

```bash
npm install --no-save playwright
npx playwright install chromium   # first time only
node scripts/verify-load.mjs      # load + panel injection + activation gating
node scripts/verify-drag.mjs      # a real pointer-drag between zones
node scripts/verify-legality.mjs  # format switching + legality summary
node scripts/verify-export.mjs    # both export formats via the clipboard
```

These scripts hit Scryfall's real API once per card in the sample deck (~100 requests). Scryfall's fair-use limit is under 10 requests/second; running these scripts repeatedly in a short window can trigger a temporary 429 rate-limit from Scryfall for your network (it clears on its own — see [their docs](https://scryfall.com/docs/api)). That's a real thing to be aware of if you're iterating quickly, not a sign of a bug — the extension's own concurrency cap (`MAX_CONCURRENT_ENRICHMENT_LOOKUPS` in `src/content/use-deck.ts`) already keeps a single real page load well within Scryfall's limit.

## Updating the bundled Commander 500 Duel banlist

Commander 500 Duel's banlist has no public API, so it ships as a maintainer-curated snapshot: `src/lib/banlist/commander-500-duel-data.json`. To update it after a real banlist change:

1. Check the current list at <https://www.duelcommander.org/banlist/>.
2. Update the four arrays in `commander-500-duel-data.json` (`bannedAsCompanion`, `bannedAsCommander`, `bannedInDeck`, `bannedForOffensiveContent`) and its `asOf` date.
3. `bannedForOffensiveContent` entries are folded into "banned-in-deck" at lookup time (`commander-500-duel.ts`) since they can't be used anywhere in the deck; keeping them in their own array is only for documenting *why* a card is banned.
4. Run `npm test` — `commander-500-duel.test.ts` exercises the lookup against a few known cards, so a malformed edit (wrong category, typo'd name) will usually fail loudly.
5. Ship a new extension version. This is a real trade-off of not having a backend yet (see `openspec/changes/commander-500-deckbuilder/design.md`): a banlist update only reaches users on the next release, not live.

Commander 500 (non-Duel) needs no such update — it reads Scryfall's own Commander legality data live, which already tracks the official Commander Rules Committee banlist.

## Known gaps / disclosed assumptions

- **Collection-page parsing (`src/lib/capture/collection-page-parser.ts`) is unverified against real markup.** LigaMagic's collection page requires a logged-in account, which wasn't available while building this. It's modeled on the confirmed deck-page markup conventions as a best effort; see the file's header comment before trusting it in production.
- **A project-hosted backend and database is intentionally not built yet** (see `design.md`'s Decisions and Open Questions) — this trades away centralized caching and release-independent banlist updates for a simpler v1 with no infrastructure to run.
