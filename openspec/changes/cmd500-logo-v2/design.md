# Design

## Context

See proposal.md - Why for motivation. Relevant current-state facts:

- The header mark (`LogoMark`) is duplicated, near-verbatim, in `extension/src/tab/TabRoot.tsx` and `extension/src/demo/DemoRoot.tsx` — a hand-authored inline SVG (gold rounded-square badge, blue "5", five WUBRG dots), all hardcoded hex colors, no theme-var usage. The `<h1>` page title next to it is visually hidden (`c500-visually-hidden`) per the prior branding change's decision to show only the mark.
- `extension/src/ui/panel.css` holds the full design-system token set (`--c500-bg`, `--c500-bg-raised`, `--c500-mana-gold`, `--c500-text`, `--c500-text-soft`, `--c500-line`, etc.), defined three times: an unguarded dark base, an `@media (prefers-color-scheme: light)` block guarded by `:not([data-theme="dark"])`, and an unconditional `[data-theme="light"]` block. `extension/src/tab/use-theme-preference.ts` sets `document.documentElement.dataset.theme` — that attribute is the only theme signal panel.css reads.
- The new design (Claude Design project `CMD500 Logo v2.html`, "Night Ledger" design system) defines a single SVG `<symbol id="mark">` (64×64 viewBox, three shapes: `.plate` an octagon path, `.fig` a zigzag peak path, `.rule` a bar) whose three fill/stroke values are driven by CSS custom properties (`--gold`, `--plate`, `--soft`) that the design file itself re-points per theme. Those three properties map 1:1 onto this repo's existing `--c500-mana-gold`, `--c500-bg`, and `--c500-text-soft`.
- `extension/public/manifest.json` references `icons/icon{16,48,128}.png` for both `icons` and `action.default_icon`. `extension/public/icons/` also holds `CMD500Deckbuilder Logo.jpeg` (the old 1.6MB source art, unused by any file) and is mirrored into `docs/icons/` for the GitHub Pages demo. `scripts/build.mjs` copies `public/` into `dist/` verbatim, so paths resolve the same from `tab.html` as from the manifest.
- `scripts/*.mjs` are all plain Node ESM scripts (no bundler-specific plumbing); the project's only build dependency today is `esbuild`. There is no image-processing library in `devDependencies` yet.
- No file in the repo currently loads a web font — `--c500-font-body` and `--c500-font-mono` are both system-font stacks (see panel.css's file-header comment, which frames this as a deliberate minimalism decision).

## Goals / Non-Goals

**Goals:**
- One canonical SVG source for the seal mark that renders correctly (crisp, correctly colored) at both toolbar-icon sizes and in-header sizes, in both themes.
- The in-app header logo re-themes automatically via the same `data-theme` mechanism already driving the rest of the UI — no new theme-branching code in the component.
- A repeatable, scriptable path from the one SVG source to the static PNGs the manifest/toolbar and docs need, so a future logo tweak doesn't require manually re-exporting half a dozen files by hand.

**Non-Goals:**
- No OS-theme-aware toolbar icon switching (`chrome.action.setIcon` driven by `matchMedia`) — out of scope per the "one fixed toolbar icon" decision; the manifest icon is a single static asset.
- No general SVG-optimization or design-token-sync pipeline — the rasterization script does exactly one job (render the seal at the sizes this change needs), not a reusable asset pipeline for future, unrelated artwork.
- No changes to `manifest.json` permissions, the build system's bundling strategy, or any persisted data shape.
- Regenerating `.github/images/*` promo assets is manual/visual work (screenshots, compositing), not scripted — only the seal/icon PNGs go through the new rasterization script.

## Decisions

**The header component renders the seal as inline SVG with `fill`/`stroke` values set to `var(--c500-mana-gold)`, `var(--c500-bg)`, and `var(--c500-text-soft)` directly — not a `<img>`/`<use>` reference to a static asset, and not a component prop threaded from `useThemePreference`.** The design file's own theming already works by re-pointing three custom properties per theme; this repo already has equivalent properties that already flip on `data-theme`. Passing the SVG's colors straight through those variables means the header logo inherits theme-switching for free, with no new state, no `theme === "dark" ? ... : ...` branch, and no risk of the mark and the rest of the UI drifting out of sync if a token value is retuned later. Alternative considered: precompute two full SVG markup strings (dark/light) and switch which one renders based on `theme` — rejected as pure duplication of markup that CSS custom properties already solve, and it would need to stay hand-synced with panel.css's token values instead of automatically tracking them.

**The seal SVG (path data for `.plate`, `.fig`, `.rule`) is copied as-is from the design file into a single new module** (a `LogoMark.tsx`-equivalent, or the existing file, exporting one component used by both `TabRoot.tsx` and `DemoRoot.tsx`) **rather than kept duplicated across the two call sites.** The two current copies of the old `LogoMark` are already fully identical hand-maintained duplicates — this is the point at which to deduplicate them into a shared import, since both files need the exact same new markup anyway.

**The wordmark ("CMD500" / "Deck Builder") is rendered as styled text elements next to the SVG mark, not baked into the SVG itself**, matching the design file's own separation (the `<symbol>` is mark-only; the lockup composes mark + a `.wm` text block via flex layout). This lets the wordmark use ordinary CSS (Cinzel font, weight, letter-spacing) instead of SVG `<text>` sizing quirks, and keeps the mark reusable standalone (e.g. for a future favicon) without carrying wordmark markup along.

**Cinzel loads via a Google Fonts `<link>` in `tab.html`** (the same host page `TabRoot`/`DemoRoot` render into), constrained with `font-display: swap` and a `"Cinzel", Georgia, "Times New Roman", serif` fallback stack applied directly to the wordmark's own CSS class — not a global font-family override. Scoping the fallback to just the wordmark selector means a slow/blocked font load only affects those two words (briefly rendering in Georgia), never any other UI text. Alternative considered: self-host the Cinzel woff2 file to avoid an external network request — rejected for this change's scope; the extension already makes external network requests (Scryfall API) so a Google Fonts request is not a new category of behavior, and self-hosting can be revisited later without touching the component code.

**The toolbar/manifest icon is rasterized once, in the dark-theme coloring, and committed as a static asset — it does not read the seal's CSS variables at all.** PNG has no equivalent of a CSS custom property; the color choice has to be baked in at export time. Dark-theme colors were chosen (per the earlier decision) because the plate's own gold outline gives it contrast against both light and dark toolbar chrome, unlike a plain light-fill version which could wash out on a light toolbar.

**A new small Node script, `scripts/generate-icons.mjs`, renders the canonical SVG (mark only, dark-theme colors hardcoded into the markup it feeds the renderer) to PNG at 16/48/128px using `@resvg/resvg-js`.** Chosen over `sharp` because resvg is a dedicated SVG rasterizer with prebuilt native bindings for Windows/macOS/Linux and no system-level dependency (no libvips, unlike sharp) — a better fit for a project whose only current build dependency is esbuild. The script takes the SVG markup as a literal string (or a small local `.svg` file) rather than trying to extract it live from the React component, keeping the rasterization step decoupled from the app's build/bundle process. It is a manually-invoked one-off script (`node scripts/generate-icons.mjs`), not wired into `scripts/build.mjs`'s automatic build — regenerating icons is a rare, deliberate act (only when the artwork changes), not something every build should redo.

**`extension/public/icons/CMD500Deckbuilder Logo.jpeg` is deleted in this change**, once `icon{16,48,128}.png` are regenerated from the new seal and nothing else references the jpeg (confirmed via repo-wide search before deletion).

## Risks / Trade-offs

- **[Risk]** A blocked or slow Google Fonts request could show a flash of fallback-styled wordmark text (FOUT) in the header. → **Mitigation:** `font-display: swap` (renders immediately in the fallback, swaps when Cinzel loads — never blocks paint) and a fallback (`Georgia`) that is visually close enough (both serif) that the swap isn't jarring.
- **[Risk]** `@resvg/resvg-js` ships prebuilt native binaries per-platform; a future contributor or CI runner on an unsupported platform could fail to install it. → **Mitigation:** it's a `devDependency` used only by a manually-run script, never at extension runtime or in the default `build`/`test` scripts — a contributor who never runs `generate-icons.mjs` is unaffected even if the optional native binary fails to resolve on their platform.
- **[Risk]** Deleting `CMD500Deckbuilder Logo.jpeg` is irreversible in the working tree (recoverable via git history only). → **Mitigation:** grep the full repo for any reference to that filename immediately before deleting, and rely on git history (not a kept-but-unused copy) as the archival record, matching how the old `LogoMark` markup itself was fully replaced rather than kept dormant in the prior branding change.
- **[Trade-off]** The toolbar icon and the in-header logo will visibly use different colorings when the app is in light mode (icon stays dark-plate/gold-stroke; header logo switches to light-plate/dark-gold-stroke). This is an accepted consequence of the "one fixed toolbar icon" decision, not an oversight.

## Migration Plan

Browser extension, no persisted-data shape change. "Deploy" is shipping the next extension version with the new icons/header bundled; "rollback" is reverting the commit (icons, component changes, and the deleted jpeg all revert together via git), no data migration in either direction. The Google Fonts `<link>` addition has no migration concern — it's declarative markup, not a stored preference.
