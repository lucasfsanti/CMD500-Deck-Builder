## 1. Fix the header grid

- [x] 1.1 Add `grid-row: 1;` to `.c500-zone__title`, `.c500-zone__toggle`, and `.c500-zone__filter` in `extension/src/ui/panel.css`. Verify `npm run build` succeeds.
- [x] 1.2 Verify visually: rebuild, reload the unpacked extension, open a deck's full-tab view, and confirm Main Deck's and Maybeboard's headers show name/count, filter, and collapse toggle all on one row — including with the filter's placeholder text and after typing into it (input growing/focus should not push it to a new row).
- [x] 1.3 Verify the fix doesn't regress zones without a filter: confirm Comandante and Comandante Parceiro still show their title and toggle on one row, with the empty center column, matching deck-organizer's "Zone header control layout" requirement.
- [x] 1.4 Run `npm test` and `npm run typecheck` to confirm the CSS-only change doesn't break anything unrelated.
