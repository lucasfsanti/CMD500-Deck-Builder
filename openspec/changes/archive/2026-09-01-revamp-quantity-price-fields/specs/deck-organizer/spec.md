## MODIFIED Requirements

### Requirement: Manual quantity edits stay grouped correctly
Only basic land cards SHALL expose an editable quantity control; non-basic cards SHALL NOT. That control SHALL be a stepper: a typeable quantity field flanked by an increment ("+1") and a decrement ("−1") button, in both List and Visual view. When the user changes a basic land's quantity by any means — typing a new value or using the +/− buttons — the organizer SHALL keep the card in its correct group for the active grouping axis and update dependent totals. Reaching a quantity of 0 by any means SHALL remove the card from the deck entirely, the same way its dedicated removal control does, rather than leaving a visible 0-quantity row.

#### Scenario: User increases a Main Deck card's quantity
- **WHEN** the user edits a basic land's quantity field in the Main Deck zone
- **THEN** the card stays in its existing group, the displayed quantity updates, and the budget total recomputes using the new quantity

#### Scenario: User clicks the increment button
- **WHEN** the user clicks a basic land's "+" button
- **THEN** its quantity increases by 1 and dependent totals update the same way a typed edit would

#### Scenario: User clicks the decrement button above quantity 1
- **WHEN** the user clicks a basic land's "−" button while its quantity is 2 or more
- **THEN** its quantity decreases by 1 and dependent totals update the same way a typed edit would

#### Scenario: User clicks the decrement button at quantity 1
- **WHEN** the user clicks a basic land's "−" button while its quantity is 1
- **THEN** the card is removed from the deck entirely, the same way its removal control would remove it

#### Scenario: User types 0 into the quantity field
- **WHEN** the user types 0 directly into a basic land's quantity field and commits it
- **THEN** the card is removed from the deck entirely, the same way its removal control would remove it

#### Scenario: Non-basic card has no quantity field
- **WHEN** a non-basic card renders in any zone, in either List or Visual view
- **THEN** no editable quantity control is shown for it

### Requirement: Manual price edit on any card
The deck view SHALL let the user edit any non-basic-land card's displayed price directly, in any zone — including Comandante and Comandante Parceiro — and in both List and Visual view, by clicking the price to turn it into an editable field. Committing the edit (Enter or blur) SHALL save the new value immediately; cancelling (Escape) SHALL leave the price unchanged. Basic lands SHALL NOT show a price field at all — their quantity stepper takes its place.

#### Scenario: User edits a Main Deck card's price
- **WHEN** the user clicks a Main Deck card's price, enters a new value, and commits it
- **THEN** the card's displayed price updates immediately, and its position under the active grouping and sort axes is recomputed using the new value

#### Scenario: User edits the primary Comandante's price
- **WHEN** the user clicks the price shown on the card in the Comandante zone and commits a new value
- **THEN** the commander's displayed price updates immediately

#### Scenario: User cancels an in-progress price edit
- **WHEN** the user opens a card's price editor and presses Escape before committing
- **THEN** the card's price is unchanged

#### Scenario: User enters an invalid price
- **WHEN** the user commits a non-numeric or negative value in the price editor
- **THEN** the edit is rejected and the card's previous price is retained

#### Scenario: User sets a price on a card that never resolved one
- **WHEN** the user clicks the price on a card whose price is unresolved (shown as "—") and commits a numeric value
- **THEN** the card's price is set to that value and displayed accordingly

#### Scenario: Price edit does not trigger a drag
- **WHEN** the user clicks into a card's price editor and types
- **THEN** no drag-and-drop move is triggered by that interaction

#### Scenario: Price edit works in Visual view
- **WHEN** the user clicks a card's price in Visual view and commits a new value
- **THEN** the tile's displayed price updates immediately, the same as in List view

#### Scenario: Basic land shows no price field
- **WHEN** a basic land renders in any zone, in either List or Visual view
- **THEN** no price field is shown for it, and its quantity stepper occupies that space instead

## ADDED Requirements

### Requirement: Editable fields give hover and control feedback distinct from the draggable row
Every editable or clickable inline control within a card row or tile (the price display before editing, the price editor's input, and the quantity stepper's buttons and input) SHALL show a cursor that signals its own affordance — a pointer for a clickable display or button, a text cursor for a typeable field — rather than inheriting the surrounding row or tile's drag cursor. No number input in the deck view SHALL show the browser's native increment/decrement spin-button controls; the quantity stepper's own +/− buttons are the only such affordance anywhere in the deck view.

#### Scenario: Hovering an editable price shows an editing cursor
- **WHEN** the user hovers a card's price display without dragging
- **THEN** the cursor indicates the price is clickable, not that the row is draggable

#### Scenario: Hovering the quantity stepper's buttons shows a clickable cursor
- **WHEN** the user hovers a basic land's "+" or "−" button
- **THEN** the cursor indicates the button is clickable, not that the row is draggable

#### Scenario: No native spin buttons appear on any number input
- **WHEN** the user hovers or focuses the quantity stepper's input or the price editor's input
- **THEN** no browser-native increment/decrement arrows are shown on that input

#### Scenario: A basic land's quantity field displays 3-digit values without clipping
- **WHEN** a basic land's quantity is 100 or any other 3-digit value
- **THEN** the full value is visible in the quantity field, not clipped or truncated
