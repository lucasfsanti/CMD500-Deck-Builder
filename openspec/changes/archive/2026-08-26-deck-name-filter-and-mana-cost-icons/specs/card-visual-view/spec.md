## ADDED Requirements

### Requirement: List view rows show mana cost icons
Each card row in List view SHALL show the card's mana cost as LigaMagic's own official mana-symbol icons, positioned between the card's name and price, using the mana-cost data deck-page-capture resolves from the page. A card with no captured mana cost (for example, a land) SHALL show no mana-cost icons, rather than an empty placeholder or a broken image. Showing mana-cost icons SHALL NOT change any other List-view row behavior — drag-and-drop, quantity editing on basic lands, the hover-revealed removal control, or the illegal/over-budget markers all continue to work the same as before.

#### Scenario: Card with a mana cost renders in List view
- **WHEN** a card with a captured mana cost renders in a List-view row
- **THEN** its mana-cost icons appear between its name and price, one icon per captured symbol, in the same order the page shows them

#### Scenario: Card with no captured mana cost renders in List view
- **WHEN** a card with no captured mana cost (for example, a land) renders in a List-view row
- **THEN** no mana-cost icons are shown for it, and the row lays out the same as any other row

#### Scenario: Mana-cost icons don't interfere with existing row functionality
- **WHEN** the user drags a card row, edits a basic land's quantity, or removes a card in List view
- **THEN** that interaction works the same as it did before mana-cost icons were added, regardless of whether the row shows mana-cost icons
