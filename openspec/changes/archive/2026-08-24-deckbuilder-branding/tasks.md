## 1. Header logo

- [x] 1.1 (revised) In `TabRoot.tsx`, replace the `<span className="c500-tab__mark" aria-hidden="true" />` with a `LogoMark` inline SVG component (`className="c500-tab__mark"`, `aria-hidden="true"`): a simplified vector redraw of the real logo — gold rounded-square badge, dark-brown border, a bold "5" monogram in place of the two-line "CMD500 Deckbuilder" wordmark, and a row of five WUBRG-colored dots. (First pass used `<img src="icons/icon128.png" alt="" />` downscaled via CSS; superseded after live review found the wordmark illegible at header size — see design.md's superseded decision.) Verify the app still builds and the header renders the mark where the dot used to be.
- [x] 1.2 (revised) In `panel.css`, drop `.c500-tab__mark`'s old flat-color-dot rules (`background`, `border`, `border-radius`, `width`/`height`) since the new mark is a self-contained 38×38 SVG that draws its own badge shape and border directly; keep only `flex-shrink: 0`. Verify visually that the mark's monogram and dot row are legible at header size.
- [x] 1.3 In `TabRoot.tsx`, add a visually-hidden utility class (e.g. `c500-visually-hidden`) to the existing `<h1 className="c500-tab__title">` instead of removing it, and define that class in `panel.css` using the standard sr-only clip pattern (1×1px, `overflow: hidden`, `position: absolute`, `clip`/`clip-path` — not `display: none` or `visibility: hidden`, which would drop it from the accessibility tree). Verify visually that only the logo shows in the header, and verify a test still finds the heading via its accessible role/name (e.g. `getByRole('heading', { name: ... })`) even though it renders nothing visible.

## 2. Footer

- [x] 2.1 In `TabRoot.tsx`, read the extension version via `chrome.runtime.getManifest().version`, guarded (optional chaining or try/catch) so it degrades to omitting the version segment rather than throwing if `chrome.runtime`/`getManifest` isn't available. Verify a fallback path exists for the unavailable case.
- [x] 2.2 Add a `<footer className="c500-tab__footer">` at the end of `.c500-tab`, outside the `pageStatus === "ok"` conditional so it always renders, containing an `<a>` reading "Feito por Lucas Santiago" linking to `https://github.com/lucasfsanti` (`target="_blank" rel="noreferrer"`) plus the version text (e.g. "v0.1.0"). Verify it renders in every `pageStatus` state (reading, unrecognized-page, ok).
- [x] 2.3 In `panel.css`, add `.c500-tab__footer` rules: full-width, quiet/muted treatment (`--c500-text-soft`, a `border-top: 1px solid var(--c500-line)`), content horizontally centered (`justify-content: center`, per live-review feedback), not sticky, sitting at the natural end of the page's normal scroll flow. Verify it doesn't overlap or compete with the sticky ledger tape.

## 3. Tests

- [x] 3.1 (revised) In `TabRoot.test.tsx`, mock `chrome.runtime.getManifest` (or the global `chrome` object, matching however the test environment currently stubs extension APIs, if at all) to return a known version, and add assertions: the header renders the `LogoMark` SVG (`svg.c500-tab__mark`, `aria-hidden="true"`), and the footer renders the GitHub link (correct `href`) and the version text. Add a case for the version-unavailable fallback (task 2.1's guard) rendering without throwing and without a version segment.

## 4. Verification

- [x] 4.1 Run the full test suite (`npm test` in `extension/`), `tsc --noEmit`, and `npm run build`, confirming everything passes.
- [x] 4.2 (revised) Load the unpacked extension, open a real LigaMagic deck's full-tab view, and visually confirm: the header shows the new vector logo mark (legible "5" monogram and dot row) instead of the old dot, and the footer at the bottom of the page shows "Feito por Lucas Santiago" (linking correctly to the GitHub profile) and the current version number, centered, styled quietly, and not overlapping the sticky ledger tape while scrolling. Confirmed by the user directly in the browser.
