# card-name-language Specification

## Purpose

Lets the user switch how captured card names are displayed — between their canonical English names and LigaMagic's own Portuguese names — via a control in the full-tab view's header, independent of the card's identity everywhere else in the extension.

## Requirements

### Requirement: Name-language toggle control
The full-tab view SHALL provide a control in the header that lets the user switch card-name display between English and Portuguese.

#### Scenario: User switches to Portuguese
- **WHEN** the user activates the toggle while card names are displaying in English
- **THEN** card names redisplay in Portuguese immediately, without a page reload

#### Scenario: User switches back to English
- **WHEN** the user activates the toggle while card names are displaying in Portuguese
- **THEN** card names redisplay in English immediately, without a page reload

### Requirement: Default name language is English
When no manual name-language preference has been stored yet, the full-tab view SHALL display card names in English.

#### Scenario: First open, no stored preference
- **WHEN** the full-tab view opens for the first time and no name-language preference has been stored before
- **THEN** card names display in English

### Requirement: Manual name-language choice persists across sessions
Once the user manually switches the name-language toggle, that choice SHALL be persisted and SHALL take precedence on every subsequent open of the full-tab view, until the user toggles again.

#### Scenario: Preference persists on reopen
- **WHEN** the user has manually selected Portuguese, then closes and reopens the full-tab view
- **THEN** the panel opens with card names displayed in Portuguese

#### Scenario: Preference persists across separate tabs
- **WHEN** the user has previously set a manual name-language preference, then opens the full-tab view for a different deck in a new tab
- **THEN** the new tab's panel also opens with card names in the previously chosen language

### Requirement: Toggle changes display only, not card identity
Switching the name-language toggle SHALL NOT change which card an entry refers to for any purpose other than display. Scryfall lookups, deduplication and grouping, budget calculation, and legality checks SHALL continue to use each card's canonical English name regardless of the toggle's state.

#### Scenario: Toggling to Portuguese does not change budget or legality results
- **WHEN** the user switches the name-language toggle to Portuguese
- **THEN** the deck's budget total, legality results, and card grouping remain exactly as they were before the switch

### Requirement: Toggle applies wherever a card's name is displayed
The toggle SHALL apply to every place a captured card's name is rendered as part of its own card display — List view rows, Visual view tiles, and hover previews — showing the same language consistently across all of them.

#### Scenario: Portuguese active across view modes
- **WHEN** the name-language toggle is set to Portuguese
- **THEN** List view rows, Visual view tiles, and hover previews all show each card's Portuguese name
