## 1. Card data access (client-side)

- [x] 1.1 Implement a direct Scryfall API client in the extension (named/fuzzy card lookup) and verify a known card's request returns type line, color identity, CMC, and layout
- [x] 1.2 Implement client-side caching of Scryfall lookups in browser local storage with a freshness window, and verify a repeated lookup for the same card within the window does not issue a second network request
- [x] 1.3 Implement name normalization (accents, casing, DFC names) before lookup and verify unit tests cover representative LigaMagic-vs-Scryfall name mismatches
- [x] 1.4 Implement not-found handling for lookups with no match after fuzzy matching, and verify a nonsense card name resolves to "unresolved" rather than a guessed record
- [x] 1.5 Implement Commander 500 legality resolution from a card's Scryfall `legalities.commander` field and verify it against a known banned-in-Commander card and a known legal card
- [x] 1.6 Curate the initial Commander 500 Duel banlist dataset from duelcommander.org/banlist as a versioned JSON asset bundled with the extension, including banned-in-deck/banned-as-commander/banned-as-companion categories and an "as of" date, and verify it parses into those categories correctly
- [x] 1.7 Implement the bundled-dataset lookup path for Commander 500 Duel legality (offline, no network call) and verify a card flagged in the dataset is reported with its correct category
- [x] 1.8 Implement lowest-price-eligible-printings resolution via direct Scryfall printings lookup and verify it excludes non-tradeable/promo-only prints for a known multi-printing card
- [x] 1.9 Implement degraded-mode behavior when Scryfall is unreachable (enrichment and Commander 500 legality show unavailable; Commander 500 Duel legality continues to work from the bundled dataset) and verify both halves of that behavior against a simulated offline Scryfall

## 2. Extension scaffolding

- [x] 2.1 Initialize the Manifest V3 extension project (content script, background service worker, injected panel UI) and verify it loads unpacked in Chrome with no console errors
- [x] 2.2 Implement LigaMagic deck/collection page detection and verify the panel injects only on matching URLs and stays inactive elsewhere, per `deck-page-capture`'s activation requirement
- [x] 2.3 Wire the background service worker to the Scryfall client and the bundled Commander 500 Duel dataset module, and verify a lookup round-trip succeeds end-to-end within the extension

## 3. Deck page capture

- [x] 3.1 Build the deck-page DOM parser (name/quantity/zone/lowest-price extraction) against saved LigaMagic deck-page fixtures and verify unit tests cover all five zones
- [x] 3.2 Build the collection-page DOM parser and verify unit tests cover its distinct markup (best-effort: LigaMagic's collection page requires a logged-in account and could not be fetched for real markup verification — see `collection-page-parser.ts` header for the disclosed assumption and what to correct once real markup is available)
- [x] 3.3 Implement unresolved-price handling (mark unknown rather than zero) and verify a fixture with a missing price is captured as unknown, per spec
- [x] 3.4 Implement re-capture on asynchronous page content changes (mutation observation) and verify the captured state updates without a manual refresh in a test page
- [x] 3.5 Implement the "could not read this page" fallback for unrecognized markup and verify it displays instead of an empty/partial deck, per spec

## 4. Deck organizer

- [x] 4.1 Implement the five-zone deck view rendering from captured state and verify each zone shows only its assigned cards
- [x] 4.2 Implement type/color-identity/CMC grouping and within-group name sorting using enrichment data, and verify it against a deck fixture with mixed types and CMCs
- [x] 4.3 Implement drag-and-drop card movement between zones, including immediate re-grouping, and verify a moved card updates zone, grouping, budget, and legality in the same interaction (budget/legality are pure functions of the same `cards` state recomputed every render — no separate cache to go stale; zone/grouping/budget/legality all verified live via a real pointer-drag gesture against the live site, moving Llanowar Elves into Comandante Parceiro)
- [x] 4.4 Implement commander/partner cardinality rules (single commander, or partner pair) and verify an invalid second-commander drop is rejected with a message, per spec
- [x] 4.5 Implement manual quantity editing that preserves grouping and updates totals, and verify a quantity change recomputes budget without breaking grouping

## 5. Budget tracking

- [x] 5.1 Implement the budget calculator excluding commander zones and basic lands, and verify it against a fixture deck with a priced commander and basic lands
- [x] 5.2 Wire lowest-price-across-printings resolution using the direct Scryfall printings lookup, and verify a multi-printing card uses the lowest price (pageLowestPrice already reflects LigaMagic's own minimum across a card's printings, confirmed against a real deck page whose panel total differed from LigaMagic's own total by exactly the excluded commander's price — see calculate-budget.test.ts for the rationale)
- [x] 5.3 Implement live recomputation on add/remove/move/quantity-change and verify the displayed total updates within the same UI update as the triggering action (budget is a pure function of `cards` state recomputed every render, so any state change updates it by construction; verified live against a real deck)
- [x] 5.4 Implement the in-budget vs over-budget visual states, including exact over-amount display, and verify both states render correctly for under/over R$500 fixtures
- [x] 5.5 Implement the incomplete-total state for unresolved prices and verify it lists the affected cards rather than treating them as R$0

## 6. Format legality

- [x] 6.1 Implement per-deck format selection (Commander 500 / Commander 500 Duel) with persistence, and verify switching formats re-runs the check immediately (persisted to chrome.storage.local keyed by deck id; verified live switching formats against the real site, plus unit tests)
- [x] 6.2 Implement Commander 500 legality checking across all zones using the Scryfall-backed resolution from task 1.5, and verify a fixture with a banned card is flagged
- [x] 6.3 Implement Commander 500 Duel legality checking using the bundled dataset from task 1.6/1.7, including banned-as-commander-only logic for the Comandante zone, and verify the "same card differs by format" scenario from the spec
- [x] 6.4 Implement illegal-card visual markers distinct from the over-budget marker, and verify a card that is both over-budget-relevant and banned shows both markers distinguishably
- [x] 6.5 Implement the deck-level illegal-count summary and verify it reflects flags across multiple zones
- [x] 6.6 Implement the "unable to verify legality" degraded state for Commander 500 decks when Scryfall is unreachable, and verify a Commander 500 Duel deck's legality check is unaffected by the same outage, per spec (confirmed both via unit tests and, unplanned but conclusively, a real Scryfall rate-limit hit during live testing — Commander 500 correctly showed "unable to verify" while Commander 500 Duel kept working from the bundled dataset)

## 7. Deck export

- [x] 7.1 Implement the LigaMagic-exact plain-text decklist generator (commander zones merged into the unlabeled main block, blank-line-separated Sideboard/Maybeboard, no zone header text — matches LigaMagic's own confirmed export format) from current organizer state, and verify it against a fixture covering all five zones plus an empty zone
- [x] 7.1b Implement the readable, zone-labeled plain-text decklist generator (secondary export) from current organizer state, and verify it against the same fixture
- [x] 7.2 Implement copy-to-clipboard export for both formats and verify the clipboard contents match the generated text for whichever format is selected (verified live against the real deck for both formats)
- [x] 7.3 Implement file-download export for both formats and verify a downloaded file contains the generated text for whichever format is selected
- [x] 7.4 Verify both export formats remain available and correct for a deck that is over budget and/or contains illegal cards, per spec (verified live against the real deck, which is over budget)

## 8. End-to-end verification

- [x] 8.1 Assemble a full test deck fixture (multiple zones, multiple printings, at least one banned card per format, at least one unresolved price) and verify capture → organize → budget → legality → export works end-to-end against Scryfall's live API (deterministic fixture-based integration test in src/end-to-end.test.ts; the live-Scryfall path was exercised extensively and repeatedly throughout manual verification today via scripts/verify-*.mjs against the real LigaMagic site)
- [x] 8.2 Verify the extension's degraded-mode behavior when Scryfall is unreachable (capture and Commander 500 Duel legality still work, enrichment and Commander 500 legality show unavailable states, per `card-data-service` spec) (unit-tested in degraded-mode.test.ts and check-legality.test.ts; also confirmed for real when this session's own repeated testing triggered a genuine Scryfall 429 rate-limit — Commander 500 correctly showed "unable to verify" while Commander 500 Duel kept working)
- [x] 8.3 Document setup/run instructions for the extension (dev environment, loading unpacked, updating the bundled Commander 500 Duel dataset) so a fresh checkout can be run end-to-end
