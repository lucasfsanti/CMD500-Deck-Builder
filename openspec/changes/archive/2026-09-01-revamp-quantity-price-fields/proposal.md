## Why

The quantity input (basic lands) and the price field (every card, since `editable-card-price`) both read poorly today: hovering either shows the row's drag-hand cursor instead of an editing affordance, native browser spin-button arrows clutter both number inputs, and the quantity field visibly clips once a basic land's count reaches two digits. Basic lands also carry a price display that's low-value clutter — it never counts toward budget and isn't the property a player actually wants to adjust for a bulk land; a proper add/remove/edit quantity control is more useful there.

## What Changes

- **BREAKING (UI only)**: For basic lands, the standalone quantity `<input>` (List: left of the name; Visual: overlaid on the artwork) is removed and replaced by a `[−][qty][+]` stepper placed where the price used to be. The price display disappears for basic lands in both views.
- The stepper's middle slot stays a real, typeable input (so quantity can still be set to an exact number), flanked by `−`/`+` buttons for one-at-a-time adjustment.
- Clicking `−` when quantity is 1, or typing `0` directly into the field, both fully remove the card — the same path the existing `×` removal control already uses — so a basic land never sits at a visible 0-quantity row.
- Every number input in the deck view (the new stepper's middle field, and the existing price editor from `editable-card-price`) has its native browser spin-button arrows hidden; the stepper's own `−`/`+` buttons are the only increment/decrement affordance that remains anywhere.
- Every interactive inline control (the price display before editing, the stepper's buttons, the stepper's and price editor's input fields) gets an explicit `cursor` style instead of inheriting the row/tile's `cursor: grab`, so hovering it reads as "editable"/"clickable" rather than "draggable".
- The quantity input's width grows enough to comfortably fit at least 3 digits without clipping, now that no spin-button box is reserved inside it.
- Non-basic cards are unaffected: they still show the (editable) price field and no quantity control.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: the "Manual quantity edits stay grouped correctly" requirement gains the stepper (add/remove buttons alongside the typed field) and the reach-zero-removes behavior; the "Manual price edit on any card" requirement (from `editable-card-price`) narrows to exclude basic lands, which no longer show a price field at all; a new requirement covers cursor affordance and the absence of native spin-button controls across every number input in the deck view.
- `card-visual-view`: the "Visual view shows artwork with identifying and pricing information" requirement changes from "basic lands show quantity *and* price" to "basic lands show the quantity stepper *instead of* price".

## Impact

- `extension/src/ui/components/CardRow.tsx` and `CardVisualTile.tsx`: replace the basic-land quantity `<input>` with a new stepper control; stop rendering `PriceCell` for basic lands.
- A new shared stepper component (e.g. `QuantityStepper`), used by both List and Visual view, mirroring how `PriceCell` is already shared.
- `extension/src/lib/organizer/deck-state.ts` / `extension/src/tab/use-tab-deck.ts`: quantity changes that reach 0 route to the existing card-removal path instead of `setCardQuantity`.
- `extension/src/ui/panel.css`: hide native number-input spin buttons app-wide; add explicit `cursor` rules for the price display, the stepper's buttons/input, and the price editor's input; widen the quantity field.
