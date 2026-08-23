## Purpose

Lets the user switch the deckbuilder between the existing name-only List view and a Visual view showing each card's artwork, without losing any existing per-card functionality.

## ADDED Requirements

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
If a card's artwork cannot be resolved (its enrichment is unavailable or the card was not found), Visual view SHALL show a placeholder tile with the card's name rather than a broken image or an empty gap.

#### Scenario: A card's artwork cannot be resolved
- **WHEN** a card's enrichment status is unavailable or not-found while in Visual view
- **THEN** that card renders as a placeholder tile showing its name, not a broken image
