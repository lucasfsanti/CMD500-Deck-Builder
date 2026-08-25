## MODIFIED Requirements

### Requirement: LigaMagic-import export matches LigaMagic's own format exactly
The extension SHALL generate a plain-text decklist matching LigaMagic's own confirmed export format: one `<quantity> <card name>` line per card, with the Comandante, Comandante Parceiro, and Main Deck zones merged into a single unlabeled block (LigaMagic's own format does not distinguish the commander from the rest of the deck), followed by a blank line and the Maybeboard block (if non-empty). This format SHALL NOT include zone header text, since LigaMagic's own importer does not produce or expect any.

#### Scenario: User exports a deck with cards in every zone
- **WHEN** the user triggers the LigaMagic-import export on a deck with cards in all four zones
- **THEN** the generated text lists the commander, partner commander, and Main Deck cards together as one unlabeled block, followed by a blank line and the Maybeboard block

#### Scenario: User exports a deck with an empty zone
- **WHEN** a zone (e.g. Maybeboard) has no cards
- **THEN** the export omits that zone's blank-line-separated block entirely rather than leaving stray blank lines

### Requirement: Readable export shows zone labels for humans
In addition to the LigaMagic-import export, the extension SHALL generate a second, clearly-labeled plain-text decklist for reading or sharing: grouped by zone (Comandante, Comandante Parceiro, Main Deck, Maybeboard) under a text header naming each non-empty zone.

#### Scenario: User exports the readable list
- **WHEN** the user triggers the readable export on a deck with cards in all four zones
- **THEN** the generated text shows each non-empty zone under its own header, with that zone's cards listed beneath it
