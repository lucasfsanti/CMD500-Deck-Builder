## Why

Real-deck testing against a ~90-card LigaMagic deck (`?view=dks/deck&id=10171831`) surfaced four bugs that all trace back to two root causes rather than four independent defects: the enrichment pipeline fires one Scryfall request per card with no batching or retry, which self-inflicts rate-limiting (26/87 requests got HTTP 429 in testing) and leaves most cards permanently unenriched — corrupting legality, type grouping, and artwork all at once; and the budget calculation counts the wrong set of zones entirely, a spec error from the original Commander 500 budget rule rather than an implementation bug.

## What Changes

- **Budget scope correction**: the R$500 total SHALL count only Main Deck and Comandante Parceiro (the partner commander). The primary Comandante stays exempt, and Sideboard/Maybeboard SHALL NOT count, since neither is part of the submitted decklist. This corrects the original rule (which counted Main Deck + Sideboard + Maybeboard and excluded both commander zones).
- **Batched Scryfall enrichment**: replace per-card `/cards/named?fuzzy=` requests with Scryfall's `/cards/collection` batch endpoint (up to 75 identifiers per call), falling back to the existing fuzzy per-card lookup only for whatever the batch reports as not found. Cuts a ~90-card deck from ~90 requests to ~2, eliminating the self-inflicted rate-limiting that was masquerading as "Scryfall unreachable."
- **Artwork sourced from LigaMagic's own page, not Scryfall**: LigaMagic already embeds every card's artwork URL directly in the page DOM (a hidden tooltip image, keyed by the card's LigaMagic id, present for every card at page load with no extra request). Capturing it makes Visual view's artwork independent of Scryfall's availability entirely; Scryfall's image remains a fallback only for the rare case the page didn't have one.
- **Artwork placeholder re-scoped**: the Visual view placeholder tile now triggers on "no image resolved from either source," not "Scryfall enrichment failed" — since artwork no longer depends on enrichment succeeding.
- **Selectable grouping axis**: the deck organizer's fixed "group by Type, ordered by Color→CMC→Name within each group" becomes a user-selectable "Group by: Type (default) / Color / Mana Cost," generalizing the existing single hardcoded grouping into three interchangeable axes, each with the other two axes as its within-group tiebreak order.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `budget-tracking`: "Budget excludes commander(s) and basic lands" requirement corrected to "Budget counts only Main Deck and Comandante Parceiro."
- `card-data-service`: card enrichment lookup becomes batch-first (Scryfall's collection endpoint) with per-card fuzzy fallback only for not-found results, instead of always issuing one request per card.
- `deck-page-capture`: initial decklist capture gains each card's artwork URL, read directly from the page DOM alongside the existing name/quantity/zone/price capture.
- `card-visual-view`: artwork resolution prefers the page-captured image over Scryfall's, and the missing-artwork placeholder's trigger condition changes accordingly.
- `deck-organizer`: the "Grouping and sorting within a zone" requirement changes from one fixed grouping to a user-selectable grouping axis (Type/Color/Mana Cost), each defaulting to a specific within-group tiebreak order.

## Impact

- `extension/src/lib/budget/calculate-budget.ts`: `isBudgetCounted` zone set changes from exclude-list to include-list.
- `extension/src/lib/scryfall/client.ts`: new batch lookup method against `/cards/collection`, with fuzzy fallback for unmatched names.
- `extension/src/lib/messaging/protocol.ts`, `client.ts`, `extension/src/background/service-worker.ts`: new batched-lookup message type alongside the existing single-card one.
- `extension/src/tab/use-tab-deck.ts`: enrichment effect changes from a 6-at-a-time streaming loop to firing the batch call for all pending cards at once.
- `extension/src/lib/capture/deck-page-parser.ts`, `collection-page-parser.ts`: new page-image extraction, keyed by each card link's `data-lc-id` against LigaMagic's own embedded tooltip image markup.
- `extension/src/lib/deck/types.ts`: `CapturedCard` gains a `pageImageUrl` field.
- `extension/src/ui/components/CardVisualTile.tsx`: artwork source preference and placeholder trigger condition change.
- `extension/src/lib/organizer/group-sort.ts`: grouping logic generalized to a selectable axis instead of one fixed grouping.
- `extension/src/ui/components/ZoneSection.tsx`, `extension/src/tab/TabRoot.tsx`: new grouping-axis selector control, applied globally across all zones.
- `openspec/specs/budget-tracking/spec.md`, `card-data-service/spec.md`, `deck-page-capture/spec.md`, `card-visual-view/spec.md`, `deck-organizer/spec.md`: requirement corrections/updates as above.
