## RENAMED Requirements

- FROM: `### Requirement: Budget excludes commander(s) and basic lands`
- TO: `### Requirement: Budget counts only Main Deck and Comandante Parceiro`

## MODIFIED Requirements

### Requirement: Budget counts only Main Deck and Comandante Parceiro
The total budget calculation SHALL count only cards in the Main Deck and Comandante Parceiro (partner commander) zones. The primary Comandante zone SHALL remain exempt, and Sideboard and Maybeboard SHALL NOT contribute to the total, since neither is part of the submitted decklist. Basic lands (Plains, Island, Swamp, Mountain, Forest, and Wastes, including their alternate-art printings) SHALL be excluded from every zone counted toward budget.

#### Scenario: Deck includes a commander and several basic lands in Main Deck
- **WHEN** the budget is computed for a deck with a priced commander and 20 basic lands in Main Deck
- **THEN** neither the commander's price nor the basic lands' prices contribute to the displayed total

#### Scenario: Deck has priced cards in Sideboard and Maybeboard
- **WHEN** the budget is computed for a deck with priced cards in Sideboard and Maybeboard, in addition to Main Deck
- **THEN** the Sideboard and Maybeboard cards' prices do not contribute to the displayed total

#### Scenario: Deck has a partner commander in Comandante Parceiro
- **WHEN** the budget is computed for a deck with a priced card in the Comandante Parceiro zone
- **THEN** that card's price contributes to the displayed total, unlike the primary Comandante
