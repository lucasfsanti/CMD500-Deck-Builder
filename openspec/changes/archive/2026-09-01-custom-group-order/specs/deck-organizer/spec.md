## MODIFIED Requirements

### Requirement: Grouping and sorting within a zone
Within each zone, the deck view SHALL group cards by a user-selectable grouping axis — card type (the default), color identity, or converted mana cost — applying to all zones at once. Groups SHALL appear in the active axis's own natural order (card type order, WUBRG color order, or ascending mana cost). Within a group, cards SHALL be sorted by a separate user-selectable sort axis — mana value (the default, ascending), name (alphabetical), color identity (colorless/W/U/B/R/G/multicolor order), or price in R$ (descending, highest first) — applying to all zones at once, with name used as a tiebreak whenever the sort axis does not fully order two cards. A card whose price has not resolved SHALL sort after every priced card when the sort axis is price. A group that has been given a custom order (see "Custom group order overrides the sort axis") SHALL render in that order instead of being sorted by the active sort axis, until the custom order is reset.

When the sort axis is Name, alphabetical ordering SHALL use whichever name-language (English or Portuguese, per `card-name-language`) was active at the moment the user selected — or most recently re-selected — the Name sort axis. A later change to the name-language toggle SHALL NOT re-sort a zone already sorted by Name; the order only updates on the next interaction with the sort-axis control, including re-selecting Name while it is already active. The name used as a tiebreak for every other sort axis (mana value, color, price) SHALL always be each card's canonical English name, regardless of the name-language toggle.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values, with the grouping axis set to Type (the default) and the sort axis set to Mana Value (the default)
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by ascending mana value and then by canonical English name

#### Scenario: User switches the grouping axis to Color
- **WHEN** the user sets the grouping axis to Color
- **THEN** every zone re-renders grouped by color identity instead of type, with groups ordered colorless/W/U/B/R/G/multicolor (the same color-identity order deck-analytics's color chart already uses), cards within each group without a custom order still ordered by the active sort axis

#### Scenario: User switches the grouping axis to Mana Cost
- **WHEN** the user sets the grouping axis to Mana Cost
- **THEN** every zone re-renders grouped by converted mana cost (ascending) instead of type, with cards within each group without a custom order still ordered by the active sort axis

#### Scenario: User switches the sort axis to Price
- **WHEN** the user sets the sort axis to Price
- **THEN** every zone re-renders with cards within each group without a custom order ordered by descending price (highest R$ first), cards with an unresolved price ordered after all priced cards, then by canonical English name

#### Scenario: User switches the sort axis to Name or Color
- **WHEN** the user sets the sort axis to Name or Color
- **THEN** every zone re-renders with cards within each group without a custom order ordered alphabetically by whichever name-language was active at the moment Name was selected, or by color identity in colorless/W/U/B/R/G/multicolor order respectively, using each card's canonical English name as the tiebreak either way

#### Scenario: User toggles name-language after sorting by Name
- **WHEN** a zone is sorted by Name and the user then switches the name-language toggle
- **THEN** that zone's sort order does not change until the user interacts with the sort-axis control again

#### Scenario: User re-selects Name after toggling name-language
- **WHEN** a zone is sorted by Name, the user switches the name-language toggle, and then re-selects Name in the sort-axis control (even though Name was already selected)
- **THEN** the zone re-sorts using the newly active name-language

#### Scenario: Non-name sort axis tiebreak ignores the name-language toggle
- **WHEN** the sort axis is Mana Value, Color, or Price and two cards tie on that axis
- **THEN** the tie is broken using the cards' canonical English names, regardless of the active name-language toggle

### Requirement: Drag-and-drop card movement between zones
The user SHALL be able to move a card from one zone to another by dragging it, and the move SHALL be reflected immediately in the organizer's grouping, the budget total, and the legality check. In Main Deck or Maybeboard, dragging a card and dropping it at a specific position among other cards within its own current group SHALL reorder that group into a custom order instead of moving the card to a different zone.

#### Scenario: User drags a card from Maybeboard to Main Deck
- **WHEN** the user drags a card from the Maybeboard zone and drops it on the Main Deck zone
- **THEN** the card is removed from Maybeboard, added to Main Deck under its correct group for the active grouping axis, and the budget and legality panels update to reflect the move

#### Scenario: User drags a card onto an invalid target
- **WHEN** the user drags a card and drops it outside any recognized zone
- **THEN** the card remains in its original zone and no state change occurs

#### Scenario: User reorders a card within its own group
- **WHEN** the user drags a card in Main Deck or Maybeboard and drops it at a different position among the other cards in its own group
- **THEN** the card moves to that position within the group and no zone change occurs

## ADDED Requirements

### Requirement: Custom group order overrides the sort axis, until reset
Reordering a card within a group (Main Deck or Maybeboard only) gives that entire group a custom order: every card in the group is stamped with the sequence it is in at that moment, and the group renders in that sequence instead of being sorted by the active sort axis. Switching the grouping axis SHALL NOT discard a group's custom order — it simply does not apply to groups formed under a different axis, since group membership is a different partition; switching back to the original grouping axis SHALL re-apply whatever custom order those groups still carry. Selecting a sort axis — whether a different one, or re-selecting the one already active — SHALL clear every group's custom order deck-wide, reverting all groups to sort-axis ordering. A card that later lands in an already-custom-ordered group (dragged in from elsewhere, or newly captured into that group) SHALL be appended at the end of that group's custom order.

#### Scenario: Reordering a card gives its whole group a custom order
- **WHEN** the user drags a card to a new position within its group
- **THEN** every card in that group is stamped with its current displayed sequence, and the group subsequently renders in that exact sequence regardless of the active sort axis

#### Scenario: Custom order goes dormant across a grouping-axis switch
- **WHEN** a group has a custom order and the user switches the grouping axis to one that partitions cards differently
- **THEN** the newly formed groups render by the active sort axis, and the original group's custom order is not discarded

#### Scenario: Custom order reactivates when the original grouping axis is restored
- **WHEN** the user switches back to the grouping axis under which a group was given a custom order
- **THEN** that group renders in its custom order again

#### Scenario: Selecting a different sort axis clears every custom order
- **WHEN** one or more groups have a custom order and the user selects a sort axis different from the one active when they were created
- **THEN** every group's custom order is cleared and all groups render by the newly selected sort axis

#### Scenario: Re-selecting the active sort axis clears every custom order
- **WHEN** one or more groups have a custom order and the user re-selects the sort axis that is already active
- **THEN** every group's custom order is cleared and all groups render by that sort axis, the same generalized resync affordance the Name-axis toggle already uses

#### Scenario: A new card joins an already-custom-ordered group
- **WHEN** a card is dragged into, or newly captured into, a group that already has a custom order
- **THEN** the new card appears at the end of that group's custom order
