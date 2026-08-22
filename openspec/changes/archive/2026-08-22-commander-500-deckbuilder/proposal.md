## Why

Brazilian Commander 500 and Commander 500 Duel players build decks under a R$500 budget cap (lowest LigaMagic price across all valid printings, excluding the commander and basic lands) with format-specific banlists, but LigaMagic's deck/collection editor has no budget tracking, no legality checking against these community formats, and no type/color/CMC organization. Players currently track budget and legality by hand. A browser extension that runs on top of the open LigaMagic page can read the deck directly from the page, manage it with a Moxfield-style organizer, and surface budget/legality feedback live.

Research confirms the two formats use different banlists: Commander 500 (multiplayer) follows the official Commander Rules Committee banlist; Commander 500 Duel (1v1) follows the independent Duel Commander banlist (duelcommander.org), which is larger and adds banned-as-commander, banned-as-companion, and offensive-content categories. Commander 500's banlist is conveniently mirrored in Scryfall's own per-card legality data, so it can be fetched live from Scryfall's public API with no curation of our own. Commander 500 Duel has no machine-readable source anywhere, so for now its banlist ships as a maintainer-curated dataset bundled with the extension; a project-hosted database and API for this (and for caching Scryfall data server-side) is left to be explored in the future.

## What Changes

- New browser extension (Manifest V3, Chrome/Edge first; structured to allow a Firefox WebExtensions build later) that activates on LigaMagic deck and collection pages.
- Content script scrapes card name, quantity, zone (Comandante, Comandante Parceiro, Main Deck, Sideboard, Maybeboard), and each card's LigaMagic lowest price directly from the open page's HTML.
- Deck organizer UI (inspired by Moxfield) that groups and sorts cards within each zone by card type, then color identity, then converted mana cost, with drag-and-drop to move cards between zones.
- Live budget panel that sums lowest LigaMagic price across all non-commander, non-basic-land cards, updates as the user edits the deck, and gives clear visual feedback when the R$500 cap is exceeded.
- Live legality panel that flags cards banned under the active format's banlist (Commander 500 vs Commander 500 Duel, user-selectable per deck) with visual feedback, distinct from the budget warning.
- Client-side card enrichment: the extension calls Scryfall's public API directly for data LigaMagic's HTML does not expose (type line, color identity, mana value, layout, valid printings), and reads Commander 500 legality straight from Scryfall's per-card legality data. Commander 500 Duel legality is checked against a maintainer-curated banlist dataset bundled with the extension, since no public source exists for it. No backend service is built in this change — a project-hosted database and API for card/banlist data is deferred to future exploration.
- Export function that turns the organized decklist into a LigaMagic-compatible plain-text decklist format.
- **BREAKING**: N/A (new product, no prior version).

Deferred to a follow-up change (explicitly out of scope here): writing the reorganized decklist back into the LigaMagic page's own editor/save flow via DOM manipulation. This proposal ships clipboard/file export only; page-write-back is a stretch goal noted in design.md for later exploration once LigaMagic's save flow is understood.

## Capabilities

### New Capabilities
- `deck-page-capture`: Extracting decklist and pricing data from the LigaMagic deck/collection page DOM into structured extension state, and keeping that state in sync as the page changes.
- `deck-organizer`: Zone model (Comandante, Comandante Parceiro, Main Deck, Sideboard, Maybeboard), drag-and-drop card movement between zones, and automatic grouping/sorting by type, color identity, and CMC within a zone.
- `budget-tracking`: Computing and displaying live deck cost from lowest LigaMagic prices, excluding commander(s) and basic lands, with visual feedback when the R$500 cap is exceeded.
- `format-legality`: Validating deck cards against the active format's banlist (Commander 500 or Commander 500 Duel) and surfacing illegal-card feedback distinct from budget feedback.
- `card-data-service`: Client-side access to card attributes not present in LigaMagic HTML (fetched directly from Scryfall's API) and to both formats' banlists — Commander 500 via Scryfall's legality data, Commander 500 Duel via a bundled, versioned dataset curated from duelcommander.org.
- `deck-export`: Converting the organized decklist into a LigaMagic-compatible text format the user can copy or download.

### Modified Capabilities
- None — this is a new product with no existing specs.

## Impact

- New repo structure: a single browser extension package (content script, background/service worker, UI, bundled banlist dataset). No separate backend service in this change.
- New external dependencies: Scryfall's public API (card metadata, printings, and Commander 500 legality, called live from the extension), duelcommander.org as the manually-curated source for the bundled Commander 500 Duel banlist dataset, and the LigaMagic page DOM as a scraping target (fragile to LigaMagic markup changes — capture logic must be isolated and testable).
- No new data store: the Commander 500 Duel banlist ships as a versioned static asset inside the extension; Scryfall lookups are cached client-side (browser storage), not server-side. A project-hosted database and API (to centralize caching and make banlist updates independent of extension releases) is explicitly deferred to future exploration.
- No existing code or specs are modified; this is the first change in the repo.
