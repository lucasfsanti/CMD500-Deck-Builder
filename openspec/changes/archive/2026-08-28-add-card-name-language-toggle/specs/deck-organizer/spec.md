## MODIFIED Requirements

### Requirement: Grouping and sorting within a zone
Within each zone, the deck view SHALL group cards by a user-selectable grouping axis — card type (the default), color identity, or converted mana cost — applying to all zones at once. Groups SHALL appear in the active axis's own natural order (card type order, WUBRG color order, or ascending mana cost). Within a group, cards SHALL be sorted by a separate user-selectable sort axis — mana value (the default, ascending), name (alphabetical), color identity (colorless/W/U/B/R/G/multicolor order), or price in R$ (descending, highest first) — applying to all zones at once, with name used as a tiebreak whenever the sort axis does not fully order two cards. A card whose price has not resolved SHALL sort after every priced card when the sort axis is price.

When the sort axis is Name, alphabetical ordering SHALL use whichever name-language (English or Portuguese, per `card-name-language`) was active at the moment the user selected — or most recently re-selected — the Name sort axis. A later change to the name-language toggle SHALL NOT re-sort a zone already sorted by Name; the order only updates on the next interaction with the sort-axis control, including re-selecting Name while it is already active. The name used as a tiebreak for every other sort axis (mana value, color, price) SHALL always be each card's canonical English name, regardless of the name-language toggle.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values, with the grouping axis set to Type (the default) and the sort axis set to Mana Value (the default)
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by ascending mana value and then by canonical English name

#### Scenario: User switches the grouping axis to Color
- **WHEN** the user sets the grouping axis to Color
- **THEN** every zone re-renders grouped by color identity instead of type, with groups ordered colorless/W/U/B/R/G/multicolor (the same color-identity order deck-analytics's color chart already uses), cards within each group still ordered by the active sort axis

#### Scenario: User switches the grouping axis to Mana Cost
- **WHEN** the user sets the grouping axis to Mana Cost
- **THEN** every zone re-renders grouped by converted mana cost (ascending) instead of type, with cards within each group still ordered by the active sort axis

#### Scenario: User switches the sort axis to Price
- **WHEN** the user sets the sort axis to Price
- **THEN** every zone re-renders with cards within each group ordered by descending price (highest R$ first), cards with an unresolved price ordered after all priced cards, then by canonical English name

#### Scenario: User switches the sort axis to Name or Color
- **WHEN** the user sets the sort axis to Name or Color
- **THEN** every zone re-renders with cards within each group ordered alphabetically by whichever name-language was active at the moment Name was selected, or by color identity in colorless/W/U/B/R/G/multicolor order respectively, using each card's canonical English name as the tiebreak either way

#### Scenario: User toggles name-language after sorting by Name
- **WHEN** a zone is sorted by Name and the user then switches the name-language toggle
- **THEN** that zone's sort order does not change until the user interacts with the sort-axis control again

#### Scenario: User re-selects Name after toggling name-language
- **WHEN** a zone is sorted by Name, the user switches the name-language toggle, and then re-selects Name in the sort-axis control (even though Name was already selected)
- **THEN** the zone re-sorts using the newly active name-language

#### Scenario: Non-name sort axis tiebreak ignores the name-language toggle
- **WHEN** the sort axis is Mana Value, Color, or Price and two cards tie on that axis
- **THEN** the tie is broken using the cards' canonical English names, regardless of the active name-language toggle

### Requirement: Per-zone name filter in Main Deck and Maybeboard
Each of the Main Deck and Maybeboard zones SHALL offer its own independent text filter control. While the user has typed text into a zone's filter, that zone SHALL show only cards whose canonical English name or Portuguese display name contains the typed text (case-insensitive), regardless of which name-language is currently displayed, and SHALL hide any group under the active grouping axis left with no matching cards. Typing into one zone's filter SHALL NOT change what the other zone shows. Clearing a zone's filter text SHALL restore all of that zone's cards. The filter SHALL NOT apply to the Comandante or Comandante Parceiro zones. A card being hidden by the filter SHALL NOT change the budget total, card count, or legality check, all of which SHALL continue to reflect the full, unfiltered deck.

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

#### Scenario: Filter matches the non-displayed name language
- **WHEN** the name-language toggle is set to English and the user types a substring that matches only a card's Portuguese name
- **THEN** that card still appears in the filtered results, even though its Portuguese name isn't currently shown on screen
