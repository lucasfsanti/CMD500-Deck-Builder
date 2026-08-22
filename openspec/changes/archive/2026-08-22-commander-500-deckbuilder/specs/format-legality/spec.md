## Purpose

Checks every card in the deck against the active format's banlist — Commander 500 (official Commander Rules Committee banlist) or Commander 500 Duel (Duel Commander banlist) — and gives the user clear, per-card feedback about illegal cards.

## ADDED Requirements

### Requirement: Per-deck format selection
The user SHALL be able to select which format the open deck is being checked against: Commander 500 or Commander 500 Duel. This selection SHALL be stored per deck and SHALL determine which banlist is applied.

#### Scenario: User switches a deck's format
- **WHEN** the user changes a deck's format from Commander 500 to Commander 500 Duel
- **THEN** the legality check re-runs immediately against the Duel Commander banlist and the displayed results update accordingly

### Requirement: Commander 500 uses the official Commander banlist
When a deck's format is Commander 500, the legality check SHALL flag any card in the deck (including the commander zones) that appears on the official Commander Rules Committee banlist.

#### Scenario: Deck contains a card banned in Commander
- **WHEN** the deck's format is Commander 500 and Main Deck contains a card on the Commander Rules Committee banlist
- **THEN** that card is flagged as illegal for this deck

### Requirement: Commander 500 Duel uses the Duel Commander banlist
When a deck's format is Commander 500 Duel, the legality check SHALL flag any card banned-in-deck or banned-as-companion under the Duel Commander banlist across all zones, and SHALL flag a card placed in Comandante or Comandante Parceiro that is banned-as-commander even if it would be legal in the 99.

#### Scenario: Deck contains a card that is banned only as commander
- **WHEN** the deck's format is Commander 500 Duel and a card banned-as-commander-only is placed in the Comandante zone
- **THEN** that card is flagged as an illegal commander, even though the same card in Main Deck would not be flagged

#### Scenario: Same card is legal in Commander 500 but banned in Commander 500 Duel
- **WHEN** a card is absent from the Commander Rules Committee banlist but present on the Duel Commander banlist, and the deck's format is Commander 500 Duel
- **THEN** the card is flagged as illegal, regardless of its Commander 500 status

### Requirement: Visual feedback distinguishes illegal cards from budget warnings
Illegal-card feedback SHALL be visually distinct from the over-budget indicator defined in the budget-tracking capability, so a user can tell at a glance whether a flagged card is a budget problem, a legality problem, or both.

#### Scenario: A card is both over-budget-relevant and banned
- **WHEN** a card contributes to the deck exceeding R$500 and is also on the active format's banlist
- **THEN** the card shows both the illegal-card indicator and is included in the over-budget contribution, using visually distinguishable markers for each

### Requirement: Deck-level illegal summary
The deck view SHALL display a summary count of illegal cards in the deck, visible without expanding individual zones.

#### Scenario: Deck has two banned cards in different zones
- **WHEN** the active banlist flags one card in Main Deck and one card in Sideboard
- **THEN** the deck-level summary shows a count of 2 illegal cards

### Requirement: Legality check degrades safely when live banlist data is unavailable
Commander 500 legality depends on a live Scryfall lookup; Commander 500 Duel legality is checked against the bundled dataset and does not require network access. If the extension cannot reach Scryfall while checking a Commander 500 deck, it SHALL show that deck's legality status as "unknown" rather than presenting it as legal by default. This does not apply to Commander 500 Duel, whose bundled data is always available offline.

#### Scenario: Scryfall is unreachable while checking a Commander 500 deck
- **WHEN** the extension cannot reach Scryfall and the deck's format is Commander 500
- **THEN** the legality panel shows an "unable to verify legality" state instead of showing zero illegal cards

#### Scenario: Scryfall is unreachable while checking a Commander 500 Duel deck
- **WHEN** the extension cannot reach Scryfall and the deck's format is Commander 500 Duel
- **THEN** the legality check still runs to completion using the bundled dataset, unaffected by Scryfall's unavailability
