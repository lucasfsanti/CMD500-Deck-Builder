## MODIFIED Requirements

### Requirement: List view rows show mana cost icons
Each card row in List view SHALL show the card's mana cost as LigaMagic's own official mana-symbol icons, positioned between the card's name and price, using the mana-cost data deck-page-capture resolves from the page. A card with no captured mana cost (for example, a land) SHALL show no mana-cost icons, rather than an empty placeholder or a broken image. For a card with more than one real printed mana cost (double-faced, split, or adventure), List view SHALL instead show each face's own mana-cost icons, in face order, separated by a `//` divider, using the per-face cost data card-data-service resolves — rather than the page's own concatenated symbols (which cannot be reliably attributed to either face) or no icons at all. Showing mana-cost icons SHALL NOT change any other List-view row behavior — drag-and-drop, quantity editing on basic lands, the hover-revealed removal control, or the illegal/over-budget markers all continue to work the same as before.

#### Scenario: Card with a mana cost renders in List view
- **WHEN** a card with one captured mana cost renders in a List-view row
- **THEN** its mana-cost icons appear between its name and price, one icon per captured symbol, in the same order the page shows them

#### Scenario: Card with no captured mana cost renders in List view
- **WHEN** a card with no captured mana cost (for example, a land) renders in a List-view row
- **THEN** no mana-cost icons are shown for it, and the row lays out the same as any other row

#### Scenario: Card with more than one real mana cost renders in List view
- **WHEN** a card with more than one real printed mana cost (for example, a double-faced, split, or adventure card) renders in a List-view row, once its per-face cost data has resolved
- **THEN** each face's mana-cost icons appear in face order, separated by a `//` divider, instead of the page's own concatenated symbols or no icons at all

#### Scenario: Mana-cost icons don't interfere with existing row functionality
- **WHEN** the user drags a card row, edits a basic land's quantity, or removes a card in List view
- **THEN** that interaction works the same as it did before mana-cost icons were added, regardless of whether the row shows mana-cost icons
