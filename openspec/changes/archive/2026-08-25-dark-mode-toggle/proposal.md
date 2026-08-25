## Why

The full-tab view has been dark-only ("Night Ledger") since the visual redesign, with no way for the panel to respect a user's own light/dark preference and no manual control if the OS-driven default isn't what they want. Some users prefer a light appearance, or simply expect the panel to follow their system's theme setting the way most modern web UI does.

## What Changes

- Add a new light theme palette as a full parallel token set alongside the existing dark "Night Ledger" tokens — designed fresh for this change, not a literal revival of the pre-redesign "Ledger, Reforged" palette (that palette was deliberately retired; light mode gets its own coherent design pass instead of resurrecting an abandoned direction).
- Add a manual toggle control in the panel's header, next to the format selector, to switch between light and dark.
- When no manual preference has been chosen yet, the panel's theme follows the browser's `prefers-color-scheme` setting (light or dark), falling back to dark if that can't be determined.
- Once the user manually toggles, that choice is persisted via `chrome.storage.local` (the same storage mechanism already used elsewhere in the extension, e.g. `lib/scryfall/cache.ts`) and overrides the OS preference on every subsequent open, until toggled again.

## Capabilities

### New Capabilities
- `panel-theming`: light/dark theme selection for the full-tab view — the toggle control, the OS-preference-based default, and the persisted manual override.

### Modified Capabilities
_None._ No existing capability's requirements change; this adds a new, independent one.

## Impact

- **Code**: `extension/src/tab/TabRoot.tsx` (theme state, toggle control), `extension/src/ui/panel.css` (new light-mode token block, OS-preference media query, manual-override selector) — likely a new small hook (e.g. `use-theme-preference.ts`) to keep the `chrome.storage` read/write and `prefers-color-scheme` listening logic out of `TabRoot.tsx` itself, matching the codebase's existing pattern of extracting stateful concerns into `tab/use-*.ts` hooks (`use-tab-deck`, `use-source-tab-status`, etc.).
- **Storage**: one new `chrome.storage.local` key for the persisted theme preference; no changes to existing stored data shapes.
- **Tests**: new tests for the toggle control and the theme-preference hook; existing tests are unaffected since they don't assert on `.c500-tab`'s color values.
- **No dependency, manifest, or API changes** — `chrome.storage.local` is already used elsewhere and needs no new permission.
