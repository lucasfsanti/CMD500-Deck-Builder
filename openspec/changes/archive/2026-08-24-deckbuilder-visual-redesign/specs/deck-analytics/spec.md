## MODIFIED Requirements

### Requirement: Mana curve chart
The full-tab view SHALL show a chart of the Main Deck's non-land card count grouped by converted mana cost (0, 1, 2, 3, ... and up), counting each non-land card's full quantity rather than counting each distinct card once. Land cards SHALL be excluded from every bucket.

#### Scenario: Main Deck has multiple copies of cards at different mana costs
- **WHEN** the Main Deck contains, for example, 4 copies of a 2-mana-cost card and 1 copy of a 4-mana-cost card
- **THEN** the mana curve chart shows a count of 4 at mana cost 2 and a count of 1 at mana cost 4

#### Scenario: Main Deck contains land cards
- **WHEN** the Main Deck contains land cards, including basic lands (typically 0 converted mana cost)
- **THEN** none of those land cards' quantities are counted in any mana curve bucket

### Requirement: Color-distribution chart
The full-tab view SHALL show a chart of the Main Deck's non-land card count grouped by color identity (colorless, each single color, and multicolor), using the same color grouping convention as the deck organizer, counting each non-land card's full quantity, plus a separate "Terrenos" bucket counting every land card's full quantity regardless of that land's own color identity.

#### Scenario: Main Deck has cards of multiple color identities
- **WHEN** the Main Deck contains colorless, mono-colored, and multicolored non-land cards
- **THEN** the color-distribution chart shows a separate count for colorless, each color present, and multicolor, scoped to non-land cards

#### Scenario: Main Deck has land cards
- **WHEN** the Main Deck contains land cards of any color identity, including colorless basic lands and multicolor-identity dual lands
- **THEN** all of those land cards' quantities are counted together in a single "Terrenos" bucket, and none of them are counted in any color-identity bucket
