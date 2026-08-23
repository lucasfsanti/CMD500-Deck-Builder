## Purpose

Opens and hosts the full deckbuilder experience in its own browser tab, replacing the in-page overlay, so there is enough room to add card artwork and deck analytics alongside the existing organizer.

## ADDED Requirements

### Requirement: Toolbar icon opens the full-tab view for the active LigaMagic deck
Clicking the extension's toolbar icon while the active tab is a LigaMagic deck or collection page SHALL open a new browser tab hosting the full deckbuilder view, scoped to that specific source page. Clicking the toolbar icon while the active tab is not a LigaMagic deck or collection page SHALL have no effect.

#### Scenario: User clicks the toolbar icon on a LigaMagic deck page
- **WHEN** the user clicks the extension's toolbar icon while a LigaMagic deck page is the active tab
- **THEN** a new tab opens showing the full deckbuilder view for that deck

#### Scenario: User clicks the toolbar icon on an unrelated page
- **WHEN** the user clicks the extension's toolbar icon while the active tab is not a LigaMagic deck or collection page
- **THEN** no new tab opens and nothing on the current page changes

### Requirement: Full-tab view replaces the in-page overlay
The extension SHALL NOT inject any visible UI into the LigaMagic page itself. All deck management (zones, drag-and-drop, budget, legality, export, visual view, analytics) SHALL be available only in the full-tab view.

#### Scenario: User opens a LigaMagic deck page
- **WHEN** the user navigates to a LigaMagic deck or collection page
- **THEN** no overlay panel appears on the page itself; the extension only becomes usable after the user clicks the toolbar icon

### Requirement: Each full-tab view is scoped to its own source deck
When multiple LigaMagic deck tabs are open, opening the full-tab view from each SHALL produce an independent view scoped to that tab's deck, without mixing data between decks. Clicking the toolbar icon again for a source tab that already has a full-tab view open SHALL focus the existing tab rather than opening a duplicate.

#### Scenario: User opens full-tab views for two different decks
- **WHEN** the user opens the full-tab view from two different LigaMagic deck tabs
- **THEN** each full-tab view shows only its own source deck's cards, independently of the other

#### Scenario: User clicks the toolbar icon twice for the same source deck
- **WHEN** the user clicks the toolbar icon for a source tab that already has an open full-tab view
- **THEN** the existing full-tab view is brought into focus instead of a new one being opened

### Requirement: Full-tab view stays live-synced with its source page while both remain open
While the source LigaMagic tab and its full-tab view are both open, capture updates from the source page (per deck-page-capture's sync requirement) SHALL propagate to the full-tab view without requiring the user to reopen it.

#### Scenario: Source page's data finishes an asynchronous reload
- **WHEN** the source LigaMagic tab's page content reloads asynchronously after the full-tab view was already opened
- **THEN** the full-tab view's captured data updates to match, the same as the in-page capture behavior it replaced

### Requirement: Full-tab view degrades gracefully if its source tab closes
If the source LigaMagic tab is closed or navigated away from a matching page while its full-tab view remains open, the full-tab view SHALL continue showing its last captured state (so the user can still organize, review, or export it) and SHALL indicate that it is no longer live-synced to a source page.

#### Scenario: User closes the source LigaMagic tab
- **WHEN** the source LigaMagic tab is closed while its full-tab view is still open
- **THEN** the full-tab view keeps showing the deck as last captured, with a visible indication that it is no longer synced to a live page
