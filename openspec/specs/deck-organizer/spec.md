# deck-organizer Specification

## Purpose

Presents the captured decklist as an editable, zone-based deck view — grouping and sorting cards within each zone and letting the user move cards between zones by drag-and-drop.

## Requirements

### Requirement: Four deck zones
The deck view SHALL organize cards into exactly four zones: Comandante, Comandante Parceiro, Main Deck, and Maybeboard, matching LigaMagic's own zone model, with Sideboard folded into Maybeboard at capture time rather than kept as its own zone.

#### Scenario: Captured deck has cards in all four zones
- **WHEN** the captured decklist includes cards assigned to each of the four zones
- **THEN** the deck view renders four distinct zone sections, each showing only the cards assigned to it

### Requirement: Grouping and sorting within a zone
Within each zone, the deck view SHALL group cards by a user-selectable grouping axis — card type (the default), color identity, or converted mana cost — applying to all zones at once. Groups SHALL appear in the active axis's own natural order (card type order, WUBRG color order, or ascending mana cost). Within a group, cards SHALL be sorted by a separate user-selectable sort axis — mana value (the default, ascending), name (alphabetical), color identity (colorless/W/U/B/R/G/multicolor order), or price in R$ (descending, highest first) — applying to all zones at once, with name used as a tiebreak whenever the sort axis does not fully order two cards. A card whose price has not resolved SHALL sort after every priced card when the sort axis is price.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values, with the grouping axis set to Type (the default) and the sort axis set to Mana Value (the default)
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by ascending mana value and then by name

#### Scenario: User switches the grouping axis to Color
- **WHEN** the user sets the grouping axis to Color
- **THEN** every zone re-renders grouped by color identity instead of type, with groups ordered colorless/W/U/B/R/G/multicolor (the same color-identity order deck-analytics's color chart already uses), cards within each group still ordered by the active sort axis

#### Scenario: User switches the grouping axis to Mana Cost
- **WHEN** the user sets the grouping axis to Mana Cost
- **THEN** every zone re-renders grouped by converted mana cost (ascending) instead of type, with cards within each group still ordered by the active sort axis

#### Scenario: User switches the sort axis to Price
- **WHEN** the user sets the sort axis to Price
- **THEN** every zone re-renders with cards within each group ordered by descending price (highest R$ first), cards with an unresolved price ordered after all priced cards, then by name

#### Scenario: User switches the sort axis to Name or Color
- **WHEN** the user sets the sort axis to Name or Color
- **THEN** every zone re-renders with cards within each group ordered alphabetically by name, or by color identity in colorless/W/U/B/R/G/multicolor order, respectively, using name as the tiebreak either way

### Requirement: Drag-and-drop card movement between zones
The user SHALL be able to move a card from one zone to another by dragging it, and the move SHALL be reflected immediately in the organizer's grouping, the budget total, and the legality check.

#### Scenario: User drags a card from Maybeboard to Main Deck
- **WHEN** the user drags a card from the Maybeboard zone and drops it on the Main Deck zone
- **THEN** the card is removed from Maybeboard, added to Main Deck under its correct group for the active grouping axis, and the budget and legality panels update to reflect the move

#### Scenario: User drags a card onto an invalid target
- **WHEN** the user drags a card and drops it outside any recognized zone
- **THEN** the card remains in its original zone and no state change occurs

### Requirement: Drag visual feedback follows the cursor
While a card is being dragged, the deckbuilder SHALL show a semi-transparent ghost of that card positioned so the point the user grabbed it remains under the pointer; the ghost SHALL disappear when the drag ends.

#### Scenario: User drags a card in List view
- **WHEN** the user presses and drags a card row
- **THEN** a semi-transparent ghost of that row follows the pointer for the duration of the drag

#### Scenario: User grabs a Visual-mode tile away from its center
- **WHEN** the user grabs a Visual-view artwork tile near its bottom edge and drags it
- **THEN** the ghost's grabbed point stays under the pointer throughout the drag, not the tile's overall bounding-box center

### Requirement: Drop-target resolution follows the pointer
The zone a dragged card is dropped into SHALL be determined by the pointer's position when the drag ends, not by the dragged card's overall bounding-box overlap with candidate zones, so the zone that visually highlights as the drop target matches what is under the user's cursor regardless of where on the card they grabbed it.

#### Scenario: Card grabbed away from its center is dropped near a zone boundary
- **WHEN** the user grabs a card away from its center and releases it with the pointer over a specific zone
- **THEN** the card moves into the zone the pointer was actually over, not a neighboring zone the card's bounding box happened to overlap

### Requirement: Commander zone cardinality
The Comandante zone SHALL accept a single card unless a legal partner-commander pair is present, in which case the Comandante Parceiro zone holds the second card; the organizer SHALL prevent placing more cards in Comandante/Comandante Parceiro than the format allows.

#### Scenario: User drags a second, non-partner card into Comandante
- **WHEN** the Comandante zone already holds a commander without the partner keyword and the user drags another card onto Comandante
- **THEN** the drop is rejected and the user sees a message explaining only a partner commander may be added

### Requirement: Manual quantity edits stay grouped correctly
Only basic land cards SHALL expose an editable quantity field; non-basic cards SHALL NOT. When the user changes a basic land's quantity directly (outside of drag-and-drop), the organizer SHALL keep the card in its correct group for the active grouping axis and update dependent totals.

#### Scenario: User increases a Main Deck card's quantity
- **WHEN** the user edits a basic land's quantity field in the Main Deck zone
- **THEN** the card stays in its existing group, the displayed quantity updates, and the budget total recomputes using the new quantity

#### Scenario: Non-basic card has no quantity field
- **WHEN** a non-basic card renders in any zone, in either List or Visual view
- **THEN** no editable quantity field is shown for it

### Requirement: Non-basic card quantity is normalized to one
A non-basic card's quantity SHALL always be treated as 1, regardless of what value the source LigaMagic page reported, including on any later re-sync from the source page.

#### Scenario: Captured page reports more than one copy of a non-basic card
- **WHEN** the captured LigaMagic page shows a quantity greater than 1 for a non-basic card
- **THEN** the organizer treats that card's quantity as 1, and dependent totals (budget, card count) are computed using 1

#### Scenario: A later re-sync from the source page still reports a stale quantity
- **WHEN** the deck re-syncs from its source LigaMagic page and the page still reports more than one copy of a non-basic card
- **THEN** the re-synced card's quantity is again normalized to 1

### Requirement: Explicit card removal
The user SHALL be able to remove any card from the deck entirely via a dedicated control on that card, distinct from moving it between zones, EXCEPT the primary Comandante, which SHALL NOT expose a removal control — the format's defining card is corrected by dragging it out to another zone and dragging the intended commander into the now-empty Comandante, not by deleting it outright. Everywhere else, the control SHALL be hidden until the card is hovered, and activating it SHALL take effect immediately, updating dependent totals (budget, card count, legality) the same way a zone move does.

#### Scenario: User removes a card from a zone
- **WHEN** the user hovers a card in any zone other than Comandante and activates its removal control
- **THEN** the card no longer appears in any zone, and the budget, card count, and legality panels update to reflect its absence

#### Scenario: Comandante has no removal control
- **WHEN** the user hovers the card in the Comandante zone
- **THEN** no removal control appears for it

#### Scenario: Removal control stays hidden until hovered
- **WHEN** a removable card is not hovered
- **THEN** its removal control is not visible

#### Scenario: Removal control does not trigger drag
- **WHEN** the user activates a removal control on a card
- **THEN** no drag-and-drop move is triggered by that interaction
