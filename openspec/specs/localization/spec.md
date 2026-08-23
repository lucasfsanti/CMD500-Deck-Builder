# localization Specification

## Purpose

Renders all user-facing UI text and both project READMEs in Brazilian Portuguese, since the extension's entire audience captures decks from LigaMagic, a Brazilian, Portuguese-language site; captured card names are excluded and stay untranslated.

## Requirements

### Requirement: UI text renders in Brazilian Portuguese
All user-facing strings in the deckbuilder UI — labels, headings, buttons, status and error messages, and tooltips — SHALL render in Brazilian Portuguese, with the sole exception of captured card names, which SHALL remain exactly as captured or resolved (their original Scryfall/LigaMagic naming), untranslated.

#### Scenario: User views the deckbuilder UI
- **WHEN** the user opens the full-tab deckbuilder view
- **THEN** every label, heading, button, and status or error message is rendered in Brazilian Portuguese

#### Scenario: Card names stay untranslated
- **WHEN** a card is rendered anywhere in the UI — a List row, a Visual tile, a hover preview, or an export
- **THEN** its name is shown exactly as captured or resolved, not translated

### Requirement: Project documentation is in Brazilian Portuguese
Both `README.md` and `extension/README.md` SHALL be written in Brazilian Portuguese.

#### Scenario: A reader opens either README
- **WHEN** a reader opens `README.md` or `extension/README.md`
- **THEN** its content is written in Brazilian Portuguese
