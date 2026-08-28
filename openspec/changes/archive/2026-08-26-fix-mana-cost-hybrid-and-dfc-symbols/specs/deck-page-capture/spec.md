## MODIFIED Requirements

### Requirement: Initial decklist capture from page HTML
On activation, the extension SHALL parse the page DOM to extract, for every card currently listed: card name, quantity, assigned zone (Comandante, Comandante Parceiro, Main Deck, or Maybeboard), the card's lowest LigaMagic price as shown on the page, the card's artwork image when the page itself embeds one for that card, and the card's mana cost when the page itself shows one for that card, resolved from the page's own mana-symbol icon markup, including two-color hybrid mana symbols. A card the page places under a Sideboard header SHALL be captured into the Maybeboard zone, since the extension does not maintain a separate Sideboard zone.

#### Scenario: Deck with cards in multiple zones
- **WHEN** the open LigaMagic deck contains cards in Comandante, Main Deck, and Maybeboard
- **THEN** the extension's internal state contains one entry per distinct card per zone with correct name, quantity, and lowest price

#### Scenario: Deck has cards under a Sideboard header
- **WHEN** the open LigaMagic deck page has cards listed under a Sideboard header
- **THEN** the extension captures those cards into the Maybeboard zone rather than a separate Sideboard zone

#### Scenario: Card name appears in the page but price is not shown
- **WHEN** a card entry in the page HTML has no visible lowest-price value
- **THEN** the extension marks that card's price as unknown rather than assuming zero, and does not silently include it in budget totals as R$0

#### Scenario: Page embeds artwork for a captured card
- **WHEN** the page's markup includes an artwork image for a captured card
- **THEN** the extension captures that image's URL alongside the card's other data, without an additional network request

#### Scenario: Page shows a mana cost for a captured card
- **WHEN** a card entry in the page HTML has one or more mana-symbol icons in its cost markup
- **THEN** the extension captures that card's mana cost as an ordered sequence of symbols, alongside its other data, without an additional network request

#### Scenario: Page shows a two-color hybrid mana symbol for a captured card
- **WHEN** a card entry in the page HTML includes a two-color hybrid mana symbol (for example, Black/Green) in its cost markup
- **THEN** the extension captures that symbol as part of the card's mana cost, the same as any other recognized symbol, rather than dropping the card's entire captured cost

#### Scenario: Card has no mana cost shown on the page
- **WHEN** a card entry in the page HTML has no mana-symbol icon markup (for example, a basic or nonbasic land)
- **THEN** the extension captures that card with no mana cost, rather than a placeholder or an assumed value
