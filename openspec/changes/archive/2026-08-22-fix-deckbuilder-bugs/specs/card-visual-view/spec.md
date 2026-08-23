## MODIFIED Requirements

### Requirement: Missing artwork degrades to a placeholder
If a card's artwork cannot be resolved from either the captured LigaMagic page data or Scryfall enrichment, Visual view SHALL show a placeholder tile with the card's name rather than a broken image or an empty gap. A card's artwork resolving from the page independently of whether its Scryfall enrichment succeeded SHALL NOT trigger the placeholder.

#### Scenario: A card's artwork cannot be resolved
- **WHEN** neither the captured page data nor Scryfall enrichment yields an artwork image for a card, while in Visual view
- **THEN** that card renders as a placeholder tile showing its name, not a broken image

#### Scenario: A card's Scryfall enrichment fails but its page-captured artwork is available
- **WHEN** a card's Scryfall enrichment status is unavailable or not-found, but the page captured an artwork image for it
- **THEN** that card renders with its artwork in Visual view, not a placeholder
