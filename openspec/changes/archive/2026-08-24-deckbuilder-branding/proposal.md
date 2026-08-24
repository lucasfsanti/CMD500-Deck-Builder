## Why

The full-tab view's header uses an abstract green-and-gold dot (`.c500-tab__mark`) as a stand-in logo — it was never the extension's actual brand mark, just a placeholder left over from the very first version of the design. The extension already ships a real logo (`extension/public/icons/icon128.png`, also used for the toolbar/manifest icons: "CMD500 Deckbuilder" wordmark over the five WUBRG mana-color dots). Separately, the page has no footer at all — no attribution for who built it, and no visible version number to reference when reporting a bug or comparing behavior across installs.

## What Changes

- Replace `.c500-tab__mark`'s abstract dot with a new header logo mark: a simplified inline vector (SVG) redraw of the extension's real logo (`icons/icon128.png`'s gold rounded-square badge, dark-brown border, blue monogram lettering, and WUBRG-colored dot row), with the two-line "CMD500 Deckbuilder" script wordmark reduced to a single bold "5". A first pass reused the raster `icon128.png` downscaled to header size (~36-40px), but its wordmark was illegible at that size in live review; the vector redraw stays crisp at any size and keeps the same color palette and dot motif instead of just being smaller.
- Remove the header's visible title text ("Montador de Decks Commander 500"), leaving only the logo. The `<h1>` stays in the DOM as a visually-hidden (screen-reader-only) element rather than being deleted, so the page keeps a real accessible heading/name for assistive tech even though nothing renders on screen.
- Add a footer to the bottom of the full-tab view: "Feito por Lucas Santiago" linking to `https://github.com/lucasfsanti`, plus the extension's current version (read live from `chrome.runtime.getManifest().version`, not hardcoded, so it can never drift from what's actually installed). Quiet styling (muted text, a hairline top border), centered horizontally, not sticky — a normal footer at the true end of the page.
- The footer renders regardless of `pageStatus` (reading/unrecognized-page/ok), as a persistent page-level element alongside the header, not scoped to the deck-loaded state.

This is presentation-only: no new capability, no change to any existing spec-governed behavior (deck logic, capture, budget, legality, analytics, drag-and-drop are all untouched). The header's `<h1>` title is visually hidden, not removed — it stays the page's actual accessible name via a standard sr-only technique, so screen readers still announce it. The logo mark itself stays decorative (`aria-hidden="true"`, the SVG-appropriate equivalent of an `<img>`'s empty `alt`) since the hidden `<h1>` already carries the accessible name.

## Capabilities

### New Capabilities
_None._ A logo swap and a static credits footer are branding/presentation, not new system behavior — nothing here is observable behavior a downstream system or spec-driven test would assert on. This change sets `skip_specs: true`.

### Modified Capabilities
_None._

## Impact

- **Code**: `extension/src/tab/TabRoot.tsx` (swap `.c500-tab__mark`'s `<span>` for a `LogoMark` inline SVG component, add a `<footer>` element), `extension/src/ui/panel.css` (`.c500-tab__mark` simplified since the SVG draws its own badge shape, new `.c500-tab__footer` rules).
- **Assets**: no new asset files — the header mark is an inline vector (SVG) drawn in code, not an image reference. `extension/public/icons/icon128.png` remains the toolbar/manifest icon, unchanged, and stays the visual reference the header mark is redrawn from.
- **Tests**: `TabRoot.test.tsx` gets new assertions for the logo mark and the footer's link/version text; no other test files affected.
- **No dependency, API, storage, or manifest changes.**
