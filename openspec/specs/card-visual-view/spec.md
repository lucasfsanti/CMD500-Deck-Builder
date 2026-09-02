# card-visual-view Specification

## Purpose

Lets the user switch the deckbuilder between the existing name-only List view and a Visual view showing each card's artwork, without losing any existing per-card functionality.

## Requirements

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

### Requirement: Visual view preserves existing per-card functionality
Drag-and-drop movement between zones, within-group custom reordering, manual quantity editing on basic lands, the hover-revealed removal control, and the illegal-card and over-budget visual markers SHALL all work the same in Visual view as they do in List view.

#### Scenario: User drags a card between zones in Visual view
- **WHEN** the user drags a card's artwork tile from one zone to another in Visual view
- **THEN** the card moves zones the same way it would in List view

#### Scenario: User reorders a tile within its group in Visual view
- **WHEN** the user drags a tile to a new position among the other tiles in its own group
- **THEN** the group takes on a custom order the same way a List-view reorder would, rendering identically whichever view is active afterward

#### Scenario: An illegal or over-budget card is shown in Visual view
- **WHEN** a card that is illegal for the active format, or that counts toward the deck being over budget, renders in Visual view
- **THEN** its illegal and/or over-budget markers are visible on its artwork tile, distinguishable the same way they are in List view

#### Scenario: User removes a card in Visual view
- **WHEN** the user activates the removal control on a Visual-view tile
- **THEN** the card is removed the same way it would be in List view

### Requirement: Missing artwork degrades to a placeholder
If a card's artwork cannot be resolved from either the captured LigaMagic page data or Scryfall enrichment, Visual view SHALL show a placeholder tile with the card's name rather than a broken image or an empty gap. A card's artwork resolving from the page independently of whether its Scryfall enrichment succeeded SHALL NOT trigger the placeholder.

#### Scenario: A card's artwork cannot be resolved
- **WHEN** neither the captured page data nor Scryfall enrichment yields an artwork image for a card, while in Visual view
- **THEN** that card renders as a placeholder tile showing its name, not a broken image

#### Scenario: A card's Scryfall enrichment fails but its page-captured artwork is available
- **WHEN** a card's Scryfall enrichment status is unavailable or not-found, but the page captured an artwork image for it
- **THEN** that card renders with its artwork in Visual view, not a placeholder

### Requirement: List view artwork hover preview
While in List view, hovering a card row SHALL show a floating preview of that card's artwork near the pointer, using the same artwork resolution as Visual view (captured page artwork, falling back to Scryfall enrichment). The preview SHALL render at a fixed 312×445px, matching LigaMagic's own hover-tooltip presentation size, rather than Visual view's small-tile size. The preview SHALL disappear when the pointer leaves the row.

#### Scenario: User hovers a row in List view
- **WHEN** the pointer hovers over a card row in List view
- **THEN** a floating preview of that card's artwork appears near the pointer, rendered at 312×445px

#### Scenario: User moves the pointer off a hovered row
- **WHEN** the pointer leaves a row that was showing its hover preview
- **THEN** the preview disappears

#### Scenario: Hovered card's artwork cannot be resolved
- **WHEN** the pointer hovers over a row for a card whose artwork cannot be resolved from either captured page data or Scryfall enrichment
- **THEN** the hover preview shows the same name-only placeholder treatment Visual view uses, rather than a broken image

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
