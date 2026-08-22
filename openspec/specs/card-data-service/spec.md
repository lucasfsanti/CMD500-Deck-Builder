# card-data-service Specification

## Purpose

Gives the extension card attributes LigaMagic's page HTML does not expose and both formats' legality data, by calling Scryfall's public API directly for card data and Commander 500 legality, and by shipping a bundled, maintainer-curated dataset for the Commander 500 Duel banlist, since no public source exists for it.

## Requirements

### Requirement: Card enrichment via direct Scryfall lookup
Given a card name captured from the LigaMagic page, the extension SHALL resolve that card's type line, color identity, converted mana cost, layout, and valid-printing set by querying Scryfall's public API directly, with no intermediary service operated by this project.

#### Scenario: Extension resolves enrichment for a captured card
- **WHEN** the extension looks up a card name captured from the LigaMagic page
- **THEN** it receives that card's type line, color identity, CMC, and layout from Scryfall

#### Scenario: Card name does not match any known card
- **WHEN** the extension looks up a card name that does not match any card in Scryfall's database, including after fuzzy matching
- **THEN** the extension treats the card as unresolved rather than presenting a partially-filled or guessed record

### Requirement: Client-side caching of Scryfall lookups
The extension SHALL cache Scryfall lookup results in local browser storage and SHALL reuse a cached result for a card instead of re-querying Scryfall for it within the cache's freshness window, to stay within Scryfall's fair-use rate limits.

#### Scenario: Same card looked up twice in one session
- **WHEN** the same card name is looked up a second time while its cached entry is still fresh
- **THEN** the extension uses the cached result instead of issuing another Scryfall request

#### Scenario: Cached entry has expired
- **WHEN** a card's cached entry is past its freshness window
- **THEN** the extension re-queries Scryfall and refreshes the cache entry

### Requirement: Commander 500 legality read from Scryfall
For the Commander 500 format, the extension SHALL determine a card's legality from Scryfall's own per-card Commander legality data, without maintaining a separate curated banlist for this format.

#### Scenario: Card is banned under Commander
- **WHEN** a card's Scryfall record marks it as banned for the Commander format
- **THEN** the extension treats that card as illegal for a Commander 500 deck

#### Scenario: Card is legal under Commander
- **WHEN** a card's Scryfall record marks it as legal for the Commander format
- **THEN** the extension treats that card as legal for a Commander 500 deck (budget rules aside)

### Requirement: Commander 500 Duel banlist ships as a bundled dataset
The extension SHALL include a versioned Commander 500 Duel banlist dataset, curated by the maintainer from the Duel Commander banlist (duelcommander.org) and updated at extension release time, distinguishing banned-in-deck, banned-as-commander, and banned-as-companion categories. The extension SHALL display the dataset's "as of" date so the user can see how current it is.

#### Scenario: Extension checks a card against the Commander 500 Duel banlist
- **WHEN** the extension checks a card against the bundled Commander 500 Duel dataset
- **THEN** it reports whether the card is banned-in-deck, banned-as-commander-only, banned-as-companion, or unrestricted, using only the bundled data (no network call)

#### Scenario: User views the Commander 500 Duel banlist status
- **WHEN** the user views legality information for a Commander 500 Duel deck
- **THEN** the bundled dataset's "as of" date is visible alongside the legality results

### Requirement: Lowest-price-eligible printings via direct Scryfall lookup
For a given card, the extension SHALL be able to determine the set of printings eligible for lowest-price comparison (excluding printings that would not have a comparable LigaMagic listing, e.g. non-paper or promo-only prints) by querying Scryfall's printings data directly. This capability exists as infrastructure for a future cross-check against LigaMagic's own price aggregation; budget-tracking does not call it in normal operation, since the price captured directly from the LigaMagic page already reflects LigaMagic's own minimum across a card's printings (see budget-tracking's spec), and Scryfall's printing catalog cannot be reliably correlated to a specific LigaMagic listing to safely override that figure.

#### Scenario: Card has both a valid tournament printing and a non-tradeable promo printing
- **WHEN** the extension resolves which printings of a card count for lowest-price comparison
- **THEN** the result excludes printings that would not have a comparable LigaMagic listing

### Requirement: Scryfall unavailability does not block reading the LigaMagic page
If Scryfall is unreachable, the extension SHALL continue to display data it already captured directly from the LigaMagic page (name, quantity, zone, page-shown price) and SHALL continue to check cards against the bundled Commander 500 Duel dataset, degrading only the features that require a live Scryfall lookup (type/color/CMC grouping, printings-based pricing, and Commander 500 legality).

#### Scenario: Scryfall is unreachable
- **WHEN** the extension cannot reach Scryfall
- **THEN** the captured decklist and page-shown prices still display, type/color/CMC grouping and Commander 500 legality show a degraded/unavailable state, and Commander 500 Duel legality (bundled, offline) continues to work normally
