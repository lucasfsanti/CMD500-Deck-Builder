# Proposal

## Why

The current brand mark is a hand-drawn placeholder (`LogoMark` in `TabRoot.tsx`/`DemoRoot.tsx`) built as a stopgap when the real raster logo proved illegible at header size. A proper logo — "Selo Octogonal," an octagonal wax-seal mark with a "CMD500 / Deck Builder" wordmark lockup — has since been designed (Claude Design project `CMD500 Logo v2.html`, design system "Night Ledger"). It needs to replace the placeholder and the old raster icon set everywhere the brand appears, in both the app's light and dark themes.

## What Changes

- Replace the inline-SVG `LogoMark` in `TabRoot.tsx` and `DemoRoot.tsx` with the new octagonal-seal mark + "CMD500 / Deck Builder" wordmark lockup, shown together in the header (the header's current visually-hidden `<h1>` treatment is removed since the name becomes visible again via the wordmark).
- Theme the header logo by referencing the existing `--c500-bg` / `--c500-mana-gold` / `--c500-text-soft` CSS custom properties (already flipped by `data-theme` per `panel-theming`) instead of hardcoded hex values, so it adapts to light/dark automatically with no new branching logic.
- **BREAKING (visual only, not behavioral)**: Add the Cinzel typeface (Google Fonts, with a `Georgia, serif` fallback stack) to the extension UI for the wordmark — a deliberate reversal of this design system's prior system-fonts-only stance.
- Add a small rasterization script (`scripts/`) that renders the canonical seal SVG to PNG at the sizes the toolbar/manifest icons need.
- Regenerate `extension/public/icons/icon16.png`, `icon48.png`, `icon128.png` (and their `docs/icons/` copies) as one fixed dark-theme rendering of the new seal (gold-stroked plate on the dark plate color) — not theme-reactive, since Chrome's toolbar action icon has no live hook into the in-page theme toggle.
- Regenerate the promo/marketing assets in `.github/images/` (banner, promo tiles, brand-PDF crops, README screenshots) to reflect the new seal.
- Delete `extension/public/icons/CMD500Deckbuilder Logo.jpeg`, the old source art, once nothing references it.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — this is a visual asset and branding change with no change to any spec-level requirement's behavior; see `.openspec.yaml`'s `skip_specs: true`, matching the precedent set by the archived `2026-08-24-deckbuilder-branding` change)

## Impact

- `extension/src/tab/TabRoot.tsx`, `extension/src/demo/DemoRoot.tsx` — header logo markup replaced.
- Extension UI stylesheet(s) — new Cinzel `@font-face`/Google Fonts `<link>`, wordmark styles.
- `extension/public/icons/icon16.png`, `icon48.png`, `icon128.png`, `docs/icons/*` — regenerated.
- `extension/public/icons/CMD500Deckbuilder Logo.jpeg` — deleted.
- `scripts/` — new rasterization script (SVG → PNG) and its dependency (e.g. an SVG-to-PNG library).
- `.github/images/*` (banner, promo tiles, brand-PDF crops), README screenshots — regenerated with the new seal.
- No manifest permissions, APIs, or persisted-data shape changes.
