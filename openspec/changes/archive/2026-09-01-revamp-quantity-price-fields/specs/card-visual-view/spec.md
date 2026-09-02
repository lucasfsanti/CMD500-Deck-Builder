## MODIFIED Requirements

### Requirement: Visual view shows artwork with identifying and pricing information
Each card in Visual view SHALL show its artwork, and — for basic lands — its editable quantity stepper in place of a price; every other card SHALL show its price (or unresolved-price indication) instead, matching the same underlying data List view shows. The Commander hero tile (Comandante) additionally SHALL show the card's name as a caption, since it is the deck's singular, named identity; grid tiles in Deck Principal and Maybeboard SHALL NOT show a visible name caption, relying on artwork alone for recognition — the name remains available as the artwork's accessible (alt) text.

#### Scenario: Card is shown in Visual view
- **WHEN** a card renders in a Deck Principal or Maybeboard Visual-mode grid tile
- **THEN** its artwork is visible on the tile, with no visible name caption, and it shows either its price or — if it is a basic land — its editable quantity stepper, but never both

#### Scenario: Non-basic card is shown in Visual view
- **WHEN** a non-basic, non-hero card renders in Visual view
- **THEN** its artwork and price are visible on the tile, with no quantity field and no name caption

#### Scenario: Commander hero tile shows its name as a caption
- **WHEN** the Comandante zone's card renders in the hero block
- **THEN** its artwork, name caption, and price are all visible
