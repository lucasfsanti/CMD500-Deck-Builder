# deck-analytics Specification

## Purpose

Shows charts summarizing the Main Deck zone's composition — mana curve, color distribution, and type distribution — so the user can see the deck's shape at a glance in the extra room the full-tab view provides.

## Requirements

### Requirement: Mana curve chart
The full-tab view SHALL show a chart of the Main Deck's card count grouped by converted mana cost (0, 1, 2, 3, ... and up), counting each card's full quantity rather than counting each distinct card once.

#### Scenario: Main Deck has multiple copies of cards at different mana costs
- **WHEN** the Main Deck contains, for example, 4 copies of a 2-mana-cost card and 1 copy of a 4-mana-cost card
- **THEN** the mana curve chart shows a count of 4 at mana cost 2 and a count of 1 at mana cost 4

### Requirement: Color-distribution chart
The full-tab view SHALL show a chart of the Main Deck's card count grouped by color identity (colorless, each single color, and multicolor), using the same color grouping convention as the deck organizer, counting each card's full quantity.

#### Scenario: Main Deck has cards of multiple color identities
- **WHEN** the Main Deck contains colorless, mono-colored, and multicolored cards
- **THEN** the color-distribution chart shows a separate count for colorless, each color present, and multicolor

### Requirement: Type-distribution chart
The full-tab view SHALL show a chart of the Main Deck's card count grouped by primary card type (the same type grouping the deck organizer already uses: Creature, Planeswalker, Instant, Sorcery, Artifact, Enchantment, Battle, Land, Other), counting each card's full quantity.

#### Scenario: Main Deck has cards of multiple types
- **WHEN** the Main Deck contains creatures, instants, and lands
- **THEN** the type-distribution chart shows a separate count for each type present

### Requirement: Charts are scoped to Main Deck only
All three charts SHALL reflect only cards in the Main Deck zone, excluding Comandante, Comandante Parceiro, and Maybeboard.

#### Scenario: Deck has cards outside Main Deck
- **WHEN** the deck has cards in Comandante and/or Maybeboard in addition to Main Deck
- **THEN** none of the three charts' counts include those cards

### Requirement: Charts update live as Main Deck changes
All three charts SHALL recompute immediately whenever a card is added to, removed from, or moved into or out of Main Deck, or has its quantity changed, consistent with the rest of the deckbuilder's live-recomputation behavior.

#### Scenario: User drags a card into Main Deck
- **WHEN** the user drags a card from another zone into Main Deck
- **THEN** the mana curve, color-distribution, and type-distribution charts all update to include it within the same UI update that shows the move
