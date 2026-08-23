## MODIFIED Requirements

### Requirement: Initial decklist capture from page HTML
On activation, the extension SHALL parse the page DOM to extract, for every card currently listed: card name, quantity, assigned zone (Comandante, Comandante Parceiro, Main Deck, Sideboard, or Maybeboard), the card's lowest LigaMagic price as shown on the page, and the card's artwork image, when the page itself embeds one for that card.

#### Scenario: Deck with cards in multiple zones
- **WHEN** the open LigaMagic deck contains cards in Comandante, Main Deck, and Sideboard
- **THEN** the extension's internal state contains one entry per distinct card per zone with correct name, quantity, and lowest price

#### Scenario: Card name appears in the page but price is not shown
- **WHEN** a card entry in the page HTML has no visible lowest-price value
- **THEN** the extension marks that card's price as unknown rather than assuming zero, and does not silently include it in budget totals as R$0

#### Scenario: Page embeds artwork for a captured card
- **WHEN** the page's markup includes an artwork image for a captured card
- **THEN** the extension captures that image's URL alongside the card's other data, without an additional network request
