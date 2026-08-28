## MODIFIED Requirements

### Requirement: Card enrichment via direct Scryfall lookup
Given card names captured from the LigaMagic page, the extension SHALL resolve each card's type line, color identity, converted mana cost, layout, and valid-printing set by querying Scryfall's public API directly, with no intermediary service operated by this project. For a card with more than one real printed mana cost (double-faced, split, adventure, or similar multi-cost layouts), the extension SHALL additionally resolve each face's own mana cost. For a full deck of captured cards, the extension SHALL resolve enrichment using a small, bounded number of Scryfall requests regardless of how many distinct cards the deck contains, falling back to an individual, fuzzy-matched lookup only for cards that could not be resolved directly.

#### Scenario: Extension resolves enrichment for a captured card
- **WHEN** the extension looks up a card name captured from the LigaMagic page
- **THEN** it receives that card's type line, color identity, CMC, and layout from Scryfall

#### Scenario: Extension resolves enrichment for a full deck
- **WHEN** the extension resolves enrichment for a deck containing many distinct captured cards
- **THEN** it issues a small, bounded number of Scryfall requests to do so, not one request per card

#### Scenario: Card name does not match any known card
- **WHEN** the extension looks up a card name that does not match any card in Scryfall's database, including after fuzzy matching
- **THEN** the extension treats the card as unresolved rather than presenting a partially-filled or guessed record

#### Scenario: Card has more than one real printed mana cost
- **WHEN** the extension resolves enrichment for a card with more than one face carrying its own real mana cost (for example, a double-faced, split, or adventure card)
- **THEN** it receives each such face's own mana cost from Scryfall, in the card's own face order

#### Scenario: Card has only one real printed mana cost
- **WHEN** the extension resolves enrichment for a card with only one face carrying a real mana cost (including double-faced cards whose back face has no printed cost, and meld cards)
- **THEN** it does not receive additional per-face cost data for that card, since there is only the one real cost
