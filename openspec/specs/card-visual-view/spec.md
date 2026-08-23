# card-visual-view Specification

## Purpose

Lets the user switch the deckbuilder between the existing name-only List view and a Visual view showing each card's artwork, without losing any existing per-card functionality.

## Requirements

### Requirement: View-mode toggle between List and Visual
The full-tab view SHALL offer a single control that switches the entire deck view between List (the existing name/quantity/price rows) and Visual (artwork thumbnails), applying to all zones at once. List SHALL remain the default view mode.

#### Scenario: User switches to Visual view
- **WHEN** the user switches the view mode to Visual
- **THEN** every zone re-renders showing each card's artwork instead of a name-only row

#### Scenario: User switches back to List view
- **WHEN** the user switches the view mode from Visual back to List
- **THEN** every zone re-renders in the original name/quantity/price row form

### Requirement: Visual view shows artwork with identifying and pricing information
Each card in Visual view SHALL show its artwork, its name as a caption, its quantity, and its price (or unresolved-price indication), matching the same underlying data List view shows.

#### Scenario: Card is shown in Visual view
- **WHEN** a card renders in Visual view
- **THEN** its artwork, name, quantity, and price are all visible on or alongside the card

### Requirement: Visual view preserves existing per-card functionality
Drag-and-drop movement between zones, manual quantity editing, and the illegal-card and over-budget visual markers SHALL all work the same in Visual view as they do in List view.

#### Scenario: User drags a card between zones in Visual view
- **WHEN** the user drags a card's artwork tile from one zone to another in Visual view
- **THEN** the card moves zones the same way it would in List view

#### Scenario: An illegal or over-budget card is shown in Visual view
- **WHEN** a card that is illegal for the active format, or that counts toward the deck being over budget, renders in Visual view
- **THEN** its illegal and/or over-budget markers are visible on its artwork tile, distinguishable the same way they are in List view

### Requirement: Missing artwork degrades to a placeholder
If a card's artwork cannot be resolved from either the captured LigaMagic page data or Scryfall enrichment, Visual view SHALL show a placeholder tile with the card's name rather than a broken image or an empty gap. A card's artwork resolving from the page independently of whether its Scryfall enrichment succeeded SHALL NOT trigger the placeholder.

#### Scenario: A card's artwork cannot be resolved
- **WHEN** neither the captured page data nor Scryfall enrichment yields an artwork image for a card, while in Visual view
- **THEN** that card renders as a placeholder tile showing its name, not a broken image

#### Scenario: A card's Scryfall enrichment fails but its page-captured artwork is available
- **WHEN** a card's Scryfall enrichment status is unavailable or not-found, but the page captured an artwork image for it
- **THEN** that card renders with its artwork in Visual view, not a placeholder

### Requirement: List view artwork hover preview
While in List view, hovering a card row SHALL show a floating preview of that card's artwork near the pointer, using the same artwork resolution as Visual view (captured page artwork, falling back to Scryfall enrichment). The preview SHALL disappear when the pointer leaves the row.

#### Scenario: User hovers a row in List view
- **WHEN** the pointer hovers over a card row in List view
- **THEN** a floating preview of that card's artwork appears near the pointer

#### Scenario: User moves the pointer off a hovered row
- **WHEN** the pointer leaves a row that was showing its hover preview
- **THEN** the preview disappears

#### Scenario: Hovered card's artwork cannot be resolved
- **WHEN** the pointer hovers over a row for a card whose artwork cannot be resolved from either captured page data or Scryfall enrichment
- **THEN** the hover preview shows the same name-only placeholder treatment Visual view uses, rather than a broken image
