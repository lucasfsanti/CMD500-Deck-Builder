# deck-export Specification

## Purpose

Lets the user take the organized decklist out of the extension in a plain-text format LigaMagic's own import accepts, and, separately, in a human-readable format for reading or sharing the list.

## Requirements

### Requirement: LigaMagic-import export matches LigaMagic's own format exactly
The extension SHALL generate a plain-text decklist matching LigaMagic's own confirmed export format: one `<quantity> <card name>` line per card, with the Comandante, Comandante Parceiro, and Main Deck zones merged into a single unlabeled block (LigaMagic's own format does not distinguish the commander from the rest of the deck), followed by a blank line and the Sideboard block (if non-empty), followed by a blank line and the Maybeboard block (if non-empty). This format SHALL NOT include zone header text, since LigaMagic's own importer does not produce or expect any.

#### Scenario: User exports a deck with cards in every zone
- **WHEN** the user triggers the LigaMagic-import export on a deck with cards in all five zones
- **THEN** the generated text lists the commander, partner commander, and Main Deck cards together as one unlabeled block, followed by a blank line and the Sideboard block, followed by a blank line and the Maybeboard block

#### Scenario: User exports a deck with an empty zone
- **WHEN** a zone (e.g. Sideboard) has no cards
- **THEN** the export omits that zone's blank-line-separated block entirely rather than leaving stray blank lines

### Requirement: Readable export shows zone labels for humans
In addition to the LigaMagic-import export, the extension SHALL generate a second, clearly-labeled plain-text decklist for reading or sharing: grouped by zone (Comandante, Comandante Parceiro, Main Deck, Sideboard, Maybeboard) under a text header naming each non-empty zone.

#### Scenario: User exports the readable list
- **WHEN** the user triggers the readable export on a deck with cards in all five zones
- **THEN** the generated text shows each non-empty zone under its own header, with that zone's cards listed beneath it

### Requirement: Both export formats are available as copy and as file download
The user SHALL be able to choose between the LigaMagic-import export and the readable export, and for whichever one they choose, both copy-to-clipboard and file-download SHALL be available, without needing to leave the extension UI.

#### Scenario: User copies the LigaMagic-import export
- **WHEN** the user selects the LigaMagic-import export and clicks the copy-to-clipboard action
- **THEN** that format's text is placed on the system clipboard

#### Scenario: User downloads the readable export
- **WHEN** the user selects the readable export and clicks the download action
- **THEN** a text file containing the readable, zone-labeled decklist is saved to the user's downloads

### Requirement: Export reflects current organizer state, not last capture
Both export formats SHALL reflect the deck as currently organized in the extension (including drag-and-drop moves and quantity edits made since the page was captured), not the state at initial page load.

#### Scenario: User exports after moving cards between zones
- **WHEN** the user has moved cards between zones since the deck was captured and then triggers either export
- **THEN** the exported text reflects the current zone assignments, not the original captured ones

### Requirement: Export does not require passing legality or budget checks
Both export formats SHALL remain available regardless of the deck's budget or legality status, so the user can export a deck that is over budget or contains flagged cards.

#### Scenario: User exports an over-budget deck
- **WHEN** the deck's budget total exceeds R$500
- **THEN** either export action still produces a complete decklist rather than being blocked
