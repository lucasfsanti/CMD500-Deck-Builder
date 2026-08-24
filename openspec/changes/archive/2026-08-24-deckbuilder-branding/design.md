## Context

See proposal.md - Why for the motivation. Relevant current-state facts:

- `.c500-tab__mark` is currently a `<span aria-hidden="true">` styled as a 20×20 circle (`background: var(--c500-mana-g); border: 2px solid var(--c500-mana-gold);`) — pure CSS, no image.
- `extension/public/icons/` holds `icon16.png`, `icon48.png`, `icon128.png` (all generated from the same source artwork) plus the original `CMD500Deckbuilder Logo.jpeg` (1.6MB). `manifest.json` references the three PNGs via paths relative to the extension root (`icons/icon16.png`, etc.); the build script (`scripts/build.mjs`) copies `public/` into `dist/` verbatim, so those same relative paths resolve from `tab.html`, which is served from the same extension root.
- The extension has no runtime access to `package.json`'s version field today; `chrome.runtime.getManifest()` is the standard extension API for reading the installed manifest (including `version`) at runtime, already available in any extension page without new permissions.
- `TabRoot.tsx` currently renders nothing after `.c500-tab__body`'s closing tag — there is no footer element to extend.

## Goals / Non-Goals

**Goals:**
- Real, recognizable brand mark in the header instead of an abstract color dot.
- A visible, always-accurate version number and attribution, without a build-time string-injection step.

**Non-Goals:**
- No changes to the toolbar/manifest icon files themselves (`icon16.png`, `icon48.png`, `icon128.png`) — those stay exactly as they are. Only the in-header mark, which lives entirely as vector markup in code rather than an image file, is redrawn for this context.
- No sticky/pinned footer — a normal footer at the true bottom of the page, not competing with the already-sticky ledger tape.
- No new build tooling (no SVG optimization pipeline, no favicon generator, no image-generation step) — the mark is authored by hand as inline SVG.

## Decisions

**[Decision, superseded]** ~~Use `icon128.png`, downscaled in CSS, not `icon48.png` at native size or a new asset.~~ First implementation did this — reused the raster `icon128.png`, downscaled via CSS to ~38px. Live review found the wordmark illegible at that size even from the sharper 128px source; downscaling a raster image only shrinks it; it doesn't make small text more readable the way a vector redraw does. Superseded by the vector-redraw decision below.

**The header mark is a hand-authored inline SVG redrawn from `icon128.png`, not a reused or newly generated raster image.** No image-generation tool was available to produce a new PNG/JPEG, and reusing the existing raster asset had already failed at header size (see superseded decision above). A vector redraw solves the actual problem — it renders crisp text at any size — while still being visually traceable to the real logo: same gold badge, dark-brown border, blue lettering, and five-dot WUBRG row. The two-line "CMD500 Deckbuilder" script wordmark is reduced to a single bold "5", since two lines of cursive text at header size isn't legible in vector form either — a single bold glyph is. `extension/public/icons/icon128.png` itself is untouched and remains the toolbar/manifest icon.

**The mark is ~38px and a rounded-square, not a forced circle.** The source artwork (wordmark + a row of five color dots) is square-ish; cropping it into a circle would cut off content unpredictably depending on exact crop math, and a rounded-square already matches this design system's existing corner-radius language (buttons, cards, the ledger tape itself all use rounded rectangles, not circles) better than the old dot did. The SVG draws its own rounded-square badge directly (an `<rect rx="16">` in a 100-unit viewBox), rather than relying on a CSS `border-radius` clip on an `<img>`.

**The `<h1>` page title becomes visually hidden, not deleted, once the header shows only the logo.** Live feedback asked to remove the visible name from the header entirely. Deleting the `<h1>` outright would leave the page with no accessible heading/name beyond the browser tab's own `<title>`, which doesn't help someone navigating by heading or landmark within the page itself. Instead the `<h1>` gets a standard visually-hidden ("sr-only") treatment — clipped to 1×1px and positioned off-screen via CSS, but still present in the DOM — so sighted users see only the logo while assistive tech still gets the same "Montador de Decks Commander 500" name it always announced.

**The logo mark stays decorative (`aria-hidden="true"`), not the page's accessible name.** The hidden `<h1>` already carries the accessible name for this region; giving the SVG an accessible name too (e.g. via `role="img"` + `aria-label`) would have a screen reader announce the brand name twice back to back. `aria-hidden="true"` is the SVG-appropriate equivalent of the old span's same attribute — inline SVG has no `alt`, so this is the correct decorative signal for this element type.

**Version comes from `chrome.runtime.getManifest().version` at render time, not a hardcoded string or a build-time constant.** A hardcoded string drifts the moment `manifest.json`'s version bumps and nobody remembers to update the footer too. Reading it live guarantees the footer always matches whatever's actually installed — useful precisely because "what version am I running" is the question this footer exists to answer when someone's comparing behavior or filing a bug.

**The footer is a plain, non-sticky element at the end of `.c500-tab`, rendered regardless of `pageStatus`.** Alternative considered: only show it once a deck loads (`pageStatus === "ok"`), matching where the ledger tape/zones live. Rejected — credits and version are properties of the *extension*, not of a particular capture; showing them only when a deck happens to be loaded would hide them during the more common "reading" state and entirely on an unrecognized page, which is exactly when a user is most likely to want the version number for a bug report.

**The footer's content is horizontally centered, not left-aligned.** Left-aligned initially, matching the header's own left-aligned mark/title. Live review asked for it centered instead — a full-width footer with a short line of credit text reads as an intentional page-ending element when centered, closer to a colophon, than when pinned to the left edge under a much wider page.

## Risks / Trade-offs

- **[Risk, superseded]** ~~`icon128.png` was generated for toolbar/manifest use (square, no transparency assumptions verified for this new context) and might not sit cleanly against `--c500-bg-raised` at the smaller header size.~~ Moot once the header mark became a hand-authored SVG instead of the raster asset — there's no image background to worry about, only the badge's own drawn fill.
- **[Risk]** `chrome.runtime` is unavailable in a non-extension context (e.g., a future test harness or a plain browser tab opened by mistake), so a naive call could throw. → **Mitigation:** guard the lookup (optional chaining / try-catch) and fall back to omitting the version segment rather than crashing the footer if `chrome.runtime` or `getManifest` isn't present.
- **[Risk]** A hand-rolled visually-hidden CSS class is easy to get subtly wrong — `display: none` or `visibility: hidden` removes the element from the accessibility tree entirely, defeating the whole point of keeping the `<h1>` as the accessible name. → **Mitigation:** use the well-established clip/absolute-position pattern (1×1px, `overflow: hidden`, `position: absolute`, `clip-path` or `clip`), not `display`/`visibility`, and verify with a test that queries the heading by accessible role/name.

## Migration Plan

Browser extension, no persisted-data shape change — CSS and one component's markup only. "Deploy" is shipping the next extension version; "rollback" is reverting the commit, no data migration needed either direction.
