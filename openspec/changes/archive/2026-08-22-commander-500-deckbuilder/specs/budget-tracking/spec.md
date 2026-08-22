## Purpose

Computes and displays the deck's total budget from LigaMagic's lowest per-card price, applying the Commander 500 exclusion rules, and gives the user clear, live feedback about the R$500 cap.

## ADDED Requirements

### Requirement: Budget excludes commander(s) and basic lands
The total budget calculation SHALL exclude cards in the Comandante and Comandante Parceiro zones, and SHALL exclude basic lands (Plains, Island, Swamp, Mountain, Forest, and Wastes, including their alternate-art printings) from every other zone counted toward budget.

#### Scenario: Deck includes a commander and several basic lands in Main Deck
- **WHEN** the budget is computed for a deck with a priced commander and 20 basic lands in Main Deck
- **THEN** neither the commander's price nor the basic lands' prices contribute to the displayed total

### Requirement: Per-card price uses lowest LigaMagic price across valid printings
For each budget-counted card, the total SHALL use the lowest LigaMagic price available across all of that card's valid printings, consistent with the price the capture and card-data-service capabilities resolve for it.

#### Scenario: A card has multiple printings with different prices
- **WHEN** a non-commander, non-basic-land card has three valid printings at different LigaMagic prices
- **THEN** the budget total uses the lowest of those three prices for that card

### Requirement: Live recomputation on deck changes
The displayed budget total SHALL update immediately whenever the user adds, removes, moves, or changes the quantity of a budget-counted card.

#### Scenario: User moves a priced card into Main Deck via drag-and-drop
- **WHEN** a budget-counted card is dragged into a budget-counted zone
- **THEN** the displayed total increases by that card's contribution within the same UI update that shows the move

### Requirement: Visual feedback when the R$500 cap is exceeded
The budget panel SHALL visually distinguish the state where the total is within the R$500 cap from the state where it exceeds the cap, and SHALL show the exact amount by which the cap is exceeded when over budget.

#### Scenario: Deck total is under R$500
- **WHEN** the computed budget total is R$480.00
- **THEN** the budget panel shows a normal/in-budget visual state

#### Scenario: Deck total exceeds R$500
- **WHEN** the computed budget total is R$540.00
- **THEN** the budget panel switches to an over-budget visual state and displays that the deck is R$40.00 over the cap

### Requirement: Unknown prices are flagged, not treated as free
If a budget-counted card's price could not be resolved (from capture or from the card-data-service), the budget panel SHALL indicate that the total is incomplete rather than silently treating the card as R$0.

#### Scenario: A budget-counted card has no resolvable price
- **WHEN** one or more budget-counted cards in the deck have an unresolved price
- **THEN** the budget panel marks the total as incomplete/uncertain and lists which cards are missing a price
