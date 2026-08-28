## MODIFIED Requirements

### Requirement: UI text renders in Brazilian Portuguese
All user-facing strings in the deckbuilder UI — labels, headings, buttons, status and error messages, and tooltips — SHALL render in Brazilian Portuguese. Captured card names are exempt from this UI-text rule: they render in English by default and switch to LigaMagic's own Portuguese names only when the user activates the name-language toggle (see `card-name-language`), independent of the surrounding UI text's language.

#### Scenario: User views the deckbuilder UI
- **WHEN** the user opens the full-tab deckbuilder view
- **THEN** every label, heading, button, and status or error message is rendered in Brazilian Portuguese

#### Scenario: Card names stay untranslated
- **WHEN** a card is rendered anywhere in the UI — a List row, a Visual tile, or a hover preview
- **THEN** its name is shown in whichever language the name-language toggle is currently set to (English or Portuguese), not translated by any other mechanism, and not necessarily following the surrounding UI text's Brazilian Portuguese

#### Scenario: Exported card names always stay English
- **WHEN** the user exports the decklist, in either export format
- **THEN** card names in the exported text are always in English, regardless of the name-language toggle's current setting
