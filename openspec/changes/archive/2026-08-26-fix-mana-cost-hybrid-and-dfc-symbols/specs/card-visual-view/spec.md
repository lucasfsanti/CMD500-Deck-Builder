## MODIFIED Requirements

### Requirement: List view rows show mana cost icons
Each card row in List view SHALL show the card's mana cost as LigaMagic's own official mana-symbol icons, positioned between the card's name and price, using the mana-cost data deck-page-capture resolves from the page. A card with no captured mana cost (for example, a land) SHALL show no mana-cost icons, rather than an empty placeholder or a broken image. A card whose resolved layout is split SHALL also show no mana-cost icons, even when the page captured a cost for it, because the page's mana-cost markup concatenates both halves' costs with no reliable way to attribute symbols to either half — showing nothing is preferred over showing a cost that cannot be trusted, confirmed consistent across multiple real split cards. Adventure and modal double-faced cards SHALL NOT be suppressed, despite also having two-cost cards: the page's markup for those layouts is confirmed inconsistent between different real cards of the same layout, so no rule could correctly distinguish which of them need suppressing — such a card's page-captured cost is shown as-is, which may occasionally show a concatenated cost for a card of those layouts, a known and accepted limitation. A meld card's or transform card's page-captured cost SHALL always be shown normally: each has only one printed, castable cost (a meld card's "meld back" is a separate conceptual card with no cost of its own; a transform card's back face has no printed cost at all), so the page never concatenates two costs for either, confirmed against real cards of both layouts (Bruna, the Fading Light, `{5}{W}{W}`; Delver of Secrets, `{U}`). Showing mana-cost icons SHALL NOT change any other List-view row behavior — drag-and-drop, quantity editing on basic lands, the hover-revealed removal control, or the illegal/over-budget markers all continue to work the same as before.

#### Scenario: Card with a mana cost renders in List view
- **WHEN** a card with a captured mana cost renders in a List-view row
- **THEN** its mana-cost icons appear between its name and price, one icon per captured symbol, in the same order the page shows them

#### Scenario: Card with no captured mana cost renders in List view
- **WHEN** a card with no captured mana cost (for example, a land) renders in a List-view row
- **THEN** no mana-cost icons are shown for it, and the row lays out the same as any other row

#### Scenario: Split card renders in List view
- **WHEN** a card whose resolved layout is split renders in a List-view row, regardless of whether the page captured a mana cost for it
- **THEN** no mana-cost icons are shown for it

#### Scenario: Meld or transform card renders in List view
- **WHEN** a meld or transform card renders in a List-view row
- **THEN** its mana-cost icons show normally, the same as any other single-faced card

#### Scenario: Adventure or modal double-faced card renders in List view
- **WHEN** an adventure or modal double-faced card renders in a List-view row
- **THEN** its page-captured mana-cost icons show as-is, without any layout-based suppression, since no reliable signal distinguishes a correctly-captured cost from a concatenated one for these layouts

#### Scenario: Mana-cost icons don't interfere with existing row functionality
- **WHEN** the user drags a card row, edits a basic land's quantity, or removes a card in List view
- **THEN** that interaction works the same as it did before mana-cost icons were added, regardless of whether the row shows mana-cost icons
