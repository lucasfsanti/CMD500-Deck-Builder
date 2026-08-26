## ADDED Requirements

### Requirement: Per-zone name filter in Main Deck and Maybeboard
Each of the Main Deck and Maybeboard zones SHALL offer its own independent text filter control. While the user has typed text into a zone's filter, that zone SHALL show only cards whose name contains the typed text (case-insensitive), and SHALL hide any group under the active grouping axis left with no matching cards. Typing into one zone's filter SHALL NOT change what the other zone shows. Clearing a zone's filter text SHALL restore all of that zone's cards. The filter SHALL NOT apply to the Comandante or Comandante Parceiro zones. A card being hidden by the filter SHALL NOT change the budget total, card count, or legality check, all of which SHALL continue to reflect the full, unfiltered deck.

#### Scenario: User filters Main Deck by name
- **WHEN** the user types a substring into the Main Deck zone's filter
- **THEN** Main Deck shows only cards whose name contains that substring, and any group left with no matching cards is hidden

#### Scenario: Filtering one zone leaves the other zone unaffected
- **WHEN** the user types into the Maybeboard zone's filter
- **THEN** the Main Deck zone's visible cards are unchanged, since each zone's filter is independent

#### Scenario: Filtered-out cards still count toward deck totals
- **WHEN** a zone's filter hides one or more cards from view
- **THEN** the budget total, card count, and legality check continue to reflect the full deck, including the hidden cards

#### Scenario: User clears a zone's filter
- **WHEN** the user clears the typed text from a zone's filter
- **THEN** that zone shows all of its cards again, grouped and sorted as usual

#### Scenario: Comandante and Comandante Parceiro have no filter
- **WHEN** the user filters Main Deck or Maybeboard
- **THEN** the Comandante and Comandante Parceiro zones are unaffected and expose no filter control of their own
