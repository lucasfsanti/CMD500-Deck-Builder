## Purpose

Reads the currently open LigaMagic deck or collection page and turns its HTML into structured card/zone/price data the rest of the extension can operate on, keeping that data in sync as the page changes.

## ADDED Requirements

### Requirement: Extension activates only on LigaMagic deck/collection pages
The extension SHALL detect whether the active tab is a LigaMagic deck editor page or a LigaMagic collection page, and SHALL remain inactive (no UI injected, no scraping performed) on any other page.

#### Scenario: User opens a LigaMagic deck page
- **WHEN** the user navigates to a LigaMagic URL that renders a deck editor
- **THEN** the extension activates and injects its UI into the page

#### Scenario: User opens a LigaMagic collection page
- **WHEN** the user navigates to a LigaMagic URL that renders a collection view
- **THEN** the extension activates and injects its UI into the page

#### Scenario: User is on an unrelated page
- **WHEN** the active tab is not a LigaMagic deck or collection page
- **THEN** the extension performs no scraping and injects no UI

### Requirement: Initial decklist capture from page HTML
On activation, the extension SHALL parse the page DOM to extract, for every card currently listed: card name, quantity, assigned zone (Comandante, Comandante Parceiro, Main Deck, Sideboard, or Maybeboard), and the card's lowest LigaMagic price as shown on the page.

#### Scenario: Deck with cards in multiple zones
- **WHEN** the open LigaMagic deck contains cards in Comandante, Main Deck, and Sideboard
- **THEN** the extension's internal state contains one entry per distinct card per zone with correct name, quantity, and lowest price

#### Scenario: Card name appears in the page but price is not shown
- **WHEN** a card entry in the page HTML has no visible lowest-price value
- **THEN** the extension marks that card's price as unknown rather than assuming zero, and does not silently include it in budget totals as R$0

### Requirement: Capture stays in sync with page state
The extension SHALL detect subsequent changes to the deck/collection made through its own UI or reflected back onto the page, and SHALL re-derive its internal state so it never diverges from what the page shows for card, zone, and price data it captured.

#### Scenario: Page content reloads asynchronously after initial capture
- **WHEN** LigaMagic's page finishes an asynchronous data load after the extension's first capture attempt
- **THEN** the extension re-captures and updates its internal state without requiring a manual page refresh

### Requirement: Capture failures are surfaced, not silent
If the extension cannot parse a recognizable decklist structure from the page (e.g., LigaMagic changed its markup), it SHALL show the user a visible notice rather than presenting an empty or partial deck as if it were complete.

#### Scenario: Page markup does not match any known LigaMagic layout
- **WHEN** the extension's parser finds no recognizable deck/collection structure on an activated page
- **THEN** the user sees a visible "could not read this page" notice instead of a blank or misleading deck view
