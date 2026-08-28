## ADDED Requirements

### Requirement: Export always uses the canonical English name
Both export formats SHALL use each card's canonical English name in the generated text, regardless of the name-language toggle's current setting.

#### Scenario: Exporting while the Portuguese name-language is active
- **WHEN** the user triggers either export format while the name-language toggle is set to Portuguese
- **THEN** the generated text uses each card's canonical English name, not its Portuguese name
