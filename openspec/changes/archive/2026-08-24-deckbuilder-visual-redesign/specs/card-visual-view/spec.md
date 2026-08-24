## MODIFIED Requirements

### Requirement: View-mode toggle between List and Visual
The full-tab view SHALL offer a single control that switches the deck view between List (the existing name/quantity/price rows) and Visual (artwork thumbnails), applying to Deck Principal and Maybeboard at once. List SHALL remain the default view mode for those zones. The Comandante and Comandante Parceiro zones SHALL always render in Visual form (the Commander hero block), independent of this control, since the commander's artwork is the format-defining identity of a Commander deck.

#### Scenario: User switches to Visual view
- **WHEN** the user switches the view mode to Visual
- **THEN** Deck Principal and Maybeboard re-render showing each card's artwork instead of a name-only row

#### Scenario: User switches back to List view
- **WHEN** the user switches the view mode from Visual back to List
- **THEN** Deck Principal and Maybeboard re-render in the original name/quantity/price row form

#### Scenario: Comandante and Comandante Parceiro are unaffected by the view-mode toggle
- **WHEN** the user switches the view mode between List and Visual
- **THEN** the Comandante and Comandante Parceiro zones continue rendering in Visual form (artwork, or the same placeholder Visual view uses when artwork can't be resolved), unchanged by the toggle

### Requirement: Visual view shows artwork with identifying and pricing information
Each card in Visual view SHALL show its artwork and its price (or unresolved-price indication), and — for basic lands only — its editable quantity, matching the same underlying data List view shows. The Commander hero tile (Comandante) additionally SHALL show the card's name as a caption, since it is the deck's singular, named identity; grid tiles in Deck Principal and Maybeboard SHALL NOT show a visible name caption, relying on artwork alone for recognition — the name remains available as the artwork's accessible (alt) text.

#### Scenario: Card is shown in Visual view
- **WHEN** a card renders in a Deck Principal or Maybeboard Visual-mode grid tile
- **THEN** its artwork and price are visible on or alongside the tile, with no visible name caption, and its editable quantity is additionally visible if it is a basic land

#### Scenario: Non-basic card is shown in Visual view
- **WHEN** a non-basic, non-hero card renders in Visual view
- **THEN** its artwork and price are visible on the tile, with no quantity field and no name caption

#### Scenario: Commander hero tile shows its name as a caption
- **WHEN** the Comandante zone's card renders in the hero block
- **THEN** its artwork, name caption, and price are all visible
