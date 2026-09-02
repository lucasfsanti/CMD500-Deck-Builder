## MODIFIED Requirements

### Requirement: List view artwork hover preview
While in List view, hovering a card row SHALL show a floating preview of that card's artwork near the pointer, using the same artwork resolution as Visual view (captured page artwork, falling back to Scryfall enrichment). The preview SHALL render at a fixed 312×445px, matching LigaMagic's own hover-tooltip presentation size, rather than Visual view's small-tile size. The preview SHALL disappear when the pointer leaves the row.

#### Scenario: User hovers a row in List view
- **WHEN** the pointer hovers over a card row in List view
- **THEN** a floating preview of that card's artwork appears near the pointer, rendered at 312×445px

#### Scenario: User moves the pointer off a hovered row
- **WHEN** the pointer leaves a row that was showing its hover preview
- **THEN** the preview disappears

#### Scenario: Hovered card's artwork cannot be resolved
- **WHEN** the pointer hovers over a row for a card whose artwork cannot be resolved from either captured page data or Scryfall enrichment
- **THEN** the hover preview shows the same name-only placeholder treatment Visual view uses, rather than a broken image
