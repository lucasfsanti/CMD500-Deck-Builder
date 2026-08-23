# deck-page-capture Specification

## Purpose

Reads the currently open LigaMagic deck or collection page and turns its HTML into structured card/zone/price data the rest of the extension can operate on, keeping that data in sync as the page changes.

## Requirements

### Requirement: Extension activates only on LigaMagic deck/collection pages
The extension SHALL detect whether the active tab is a LigaMagic deck editor page or a LigaMagic collection page, and SHALL remain inactive (no capture performed) on any other page. On a matching page, the extension SHALL capture data silently, without injecting any UI into the page — the deckbuilder UI lives only in the full-tab view (see `deck-tab-view`), opened separately via the extension's toolbar icon.

#### Scenario: User opens a LigaMagic deck page
- **WHEN** the user navigates to a LigaMagic URL that renders a deck editor
- **THEN** the extension activates and begins capturing the page's data, without injecting any UI into the page

#### Scenario: User opens a LigaMagic collection page
- **WHEN** the user navigates to a LigaMagic URL that renders a collection view
- **THEN** the extension activates and begins capturing the page's data, without injecting any UI into the page

#### Scenario: User is on an unrelated page
- **WHEN** the active tab is not a LigaMagic deck or collection page
- **THEN** the extension performs no scraping

### Requirement: Initial decklist capture from page HTML
On activation, the extension SHALL parse the page DOM to extract, for every card currently listed: card name, quantity, assigned zone (Comandante, Comandante Parceiro, Main Deck, or Maybeboard), the card's lowest LigaMagic price as shown on the page, and the card's artwork image, when the page itself embeds one for that card. A card the page places under a Sideboard header SHALL be captured into the Maybeboard zone, since the extension does not maintain a separate Sideboard zone.

#### Scenario: Deck with cards in multiple zones
- **WHEN** the open LigaMagic deck contains cards in Comandante, Main Deck, and Maybeboard
- **THEN** the extension's internal state contains one entry per distinct card per zone with correct name, quantity, and lowest price

#### Scenario: Deck has cards under a Sideboard header
- **WHEN** the open LigaMagic deck page has cards listed under a Sideboard header
- **THEN** the extension captures those cards into the Maybeboard zone rather than a separate Sideboard zone

#### Scenario: Card name appears in the page but price is not shown
- **WHEN** a card entry in the page HTML has no visible lowest-price value
- **THEN** the extension marks that card's price as unknown rather than assuming zero, and does not silently include it in budget totals as R$0

#### Scenario: Page embeds artwork for a captured card
- **WHEN** the page's markup includes an artwork image for a captured card
- **THEN** the extension captures that image's URL alongside the card's other data, without an additional network request

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
