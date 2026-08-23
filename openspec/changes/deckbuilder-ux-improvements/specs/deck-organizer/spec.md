## REMOVED Requirements

### Requirement: Five deck zones
**Reason**: Sideboard is being removed as a distinct zone — LigaMagic's Sideboard-labeled cards are now captured directly into Maybeboard instead of their own zone.
**Migration**: No user action needed; existing decks are simply re-captured with Sideboard-zone cards appearing under Maybeboard. See the replacement "Four deck zones" requirement.

## ADDED Requirements

### Requirement: Four deck zones
The deck view SHALL organize cards into exactly four zones: Comandante, Comandante Parceiro, Main Deck, and Maybeboard, matching LigaMagic's own zone model, with Sideboard folded into Maybeboard at capture time rather than kept as its own zone.

#### Scenario: Captured deck has cards in all four zones
- **WHEN** the captured decklist includes cards assigned to each of the four zones
- **THEN** the deck view renders four distinct zone sections, each showing only the cards assigned to it

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
