## MODIFIED Requirements

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
