## 1. Budget scope correction

- [x] 1.1 Change `isBudgetCounted`'s zone set from an exclude-list to an include-list (Main Deck + Comandante Parceiro only), and verify unit tests cover: Sideboard and Maybeboard cards excluded, the primary Comandante excluded, a Comandante Parceiro card included, and basic lands still excluded regardless of zone

## 2. Batched Scryfall enrichment

- [x] 2.1 Add a batch lookup method to the Scryfall client against the collection endpoint (chunked to the endpoint's per-request identifier limit), falling back to the existing fuzzy per-card lookup only for names the batch reports as not found, and verify unit tests cover: a batch of matched names resolving without any individual fallback call, a not-found subset falling back to fuzzy lookup, and per-card caching still applying
- [x] 2.2 Add a batched-lookup message type to the messaging protocol/client and its background handler, mirroring the existing single-card lookup message, and verify a unit test confirms the background dispatches a batch request to the new client method
- [x] 2.3 Rework the tab page's enrichment effect to request all pending cards in one batched call instead of a fixed-concurrency streaming loop, and verify a unit test confirms every pending card is requested together and each result is applied back to the correct card by id

## 3. Artwork sourced from the LigaMagic page

- [x] 3.1 Add `pageImageUrl` to `CapturedCard` and extract it in both the deck-page and collection-page parsers, via the card link's LigaMagic id against the page's embedded per-card tooltip image markup, and verify unit tests cover a card with an embedded image and a card without one
- [x] 3.2 Update `CardVisualTile` to prefer the page-captured image over Scryfall's enrichment image, and re-scope the missing-artwork placeholder to trigger only when neither source resolves, and verify a component test covers: page-image present with failed enrichment (shows art, not placeholder), Scryfall-image present with no page image (shows art), and neither present (placeholder)

## 4. Selectable grouping axis

- [x] 4.1 Generalize the zone grouping function to take a grouping axis (Type default / Color / Mana Cost), with group ordering and within-group tiebreak order per design.md's decision, and verify unit tests cover all three axes and confirm the Type-axis output is byte-for-byte unchanged from before this change (also corrected a real self-contradiction caught mid-implementation: the delta spec's "Grouping and sorting within a zone" requirement text and design.md's grouping-axis decision both said group *order* should come from "the other axis," which conflicted with their own worked scenarios/table — and separately, the Color scenario said "colorless last," contradicting deck-analytics's already-shipped colorless-first color order in `bucket-counts.ts`. Fixed both artifacts to match the correct, consistent, already-established convention: each axis orders its own groups by its own natural order; colorless sorts first)
- [x] 4.2 Add a grouping-axis selector control to the tab page, applied globally across all zones alongside the existing view-mode toggle, and verify a component test covers switching the axis and every zone re-rendering under the new grouping

## 5. Docs

- [x] 5.1 Update `extension/README.md`'s Scryfall rate-limit note (currently describes one request per card and references the removed per-card concurrency cap) to reflect the batched lookup, and verify the doc no longer references removed identifiers

## 6. Live verification against the reported deck

- [x] 6.1 Run the full test suite, typecheck, and build, and verify all three are clean
- [x] 6.2 Verify live against `?view=dks/deck&id=10171831` that the budget total counts only Main Deck and Comandante Parceiro cards (verified via `verify-bugfixes.mjs`: displayed total R$410,04 matches an independently-computed Main-Deck-+-Comandante-Parceiro-only total exactly; the real Sideboard+Maybeboard total of R$1582,53 is confirmed excluded)
- [x] 6.3 Verify live that legality resolves (not stuck on "unable to verify") and that Scryfall request volume for the deck is a small, bounded number rather than one request per card (verified via `verify-bugfixes.mjs`: legality panel reads "No illegal cards"; only 3 total Scryfall requests for the whole deck, all successful collection-batch calls, zero fuzzy fallbacks needed — down from 87 individual requests with 26 rate-limited before this change)
- [x] 6.4 Verify live that Visual view shows real artwork for effectively all cards, including any whose Scryfall enrichment still fails (verified via `verify-bugfixes.mjs`: 161/161 tiles resolved real artwork, 0 placeholders; screenshot-confirmed full-resolution card art rendering directly from LigaMagic's page)
- [x] 6.5 Verify live that zones show cards spread across their real types by default (not collapsed into Creature/Other), and that switching the grouping axis to Color and to Mana Cost re-renders every zone correctly (verified via `verify-bugfixes.mjs`: Type axis shows Creature/Planeswalker/Instant/Sorcery/Artifact/Enchantment/Land group labels across zones; Color and Mana Cost axes both re-render with correct, distinct group labels on switch)
