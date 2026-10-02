# Tasks

## 1. Shared logo component

- [x] 1.1 Create a shared `LogoMark` module containing the octagonal-seal SVG (`.plate`, `.fig`, `.rule` paths from the design file, 64×64 viewBox) with `fill`/`stroke` set to `var(--c500-bg)`, `var(--c500-mana-gold)`, and `var(--c500-text-soft)` respectively, and verify it renders visually correct in both light and dark themes by toggling `data-theme` in a running dev build.
- [x] 1.2 Add the "CMD500" / "Deck Builder" wordmark as styled text elements (Cinzel bold / Cinzel small-caps italic per the design's two-line lockup) composed next to the mark, and verify the lockup matches the design's proportions at the in-header size (~38–58px mark height).
- [x] 1.3 Update `TabRoot.tsx` and `DemoRoot.tsx` to import and render the shared `LogoMark` lockup in the header, removing each file's own duplicated inline SVG, and verify both the real extension tab and the demo page show the new logo.
- [x] 1.4 Decision (resolved with user): keep the header's `c500-visually-hidden` `<h1>` exactly as-is (still "Montador de Decks Commander 500", the page's accessible name) — the new wordmark is purely decorative branding (`aria-hidden`, like a logo image) alongside the mark, not a heading itself. Verified no change was needed to the `<h1>` markup.
- [x] 1.5 Update or add component tests (`TabRoot`/`DemoRoot` test files) covering the new header markup, and verify `npm test` passes.

## 2. Cinzel font loading

- [x] 2.1 Add a Google Fonts `<link>` for Cinzel (weights 400/600, matching the design file) to `tab.html`, and verify the font request appears in the network panel when the tab loads.
- [x] 2.2 Add a wordmark-scoped CSS class with `font-family: "Cinzel", Georgia, "Times New Roman", serif` (not a global font-family change); `font-display: swap` is set via the Google Fonts `<link>`'s own `display=swap` query param, not a CSS property (it only has effect inside an `@font-face` rule), and verify no other UI text's computed font-family changes.

## 3. Icon rasterization script

- [x] 3.1 Add `@resvg/resvg-js` as a devDependency and verify `npm install` succeeds.
- [x] 3.2 Create `scripts/generate-icons.mjs`: takes the canonical seal SVG (mark only, dark-theme colors hardcoded — dark plate fill, gold stroke/fig, soft-gray rule) and rasterizes it to PNG at 16, 48, and 128px, writing to `extension/public/icons/icon{16,48,128}.png`, and verify running `node scripts/generate-icons.mjs` produces three PNG files of the expected dimensions. Verified: 16x16 (468B), 48x48 (786B), 128x128 (1595B), and the 128px render visually matches the design (dark plate, gold outline/crown, soft-gray rule).
- [x] 3.3 Run the script and regenerate `extension/public/icons/icon16.png`, `icon48.png`, `icon128.png`, and copy the results into `docs/icons/` (kept in sync per the existing convention — also auto-synced by `build:demo`), and verify both directories' icons are byte-identical to each other and visually match the new seal. Verified via matching MD5 hashes for all three sizes.
- [ ] 3.4 **Needs manual verification**: reload the unpacked extension in Chrome and verify the toolbar/action icon shows the new seal at its native size. The browser pane available in this session is sandboxed and separate from real Chrome — it cannot load unpacked extensions or show the browser toolbar, so this step needs the user to check it directly (`chrome://extensions` → reload → check the toolbar icon).

## 4. Cleanup

- [x] 4.1 Search the repository for any reference to `CMD500Deckbuilder Logo.jpeg` and confirm there are none, then delete `extension/public/icons/CMD500Deckbuilder Logo.jpeg`, and verify `git status` shows only the deletion (no broken references reported by `npm run typecheck` / `npm run build`). Verified: only this change's own planning docs mentioned the filename; deleted, `git status` shows a clean `D` with no other side effects.

## 5. Promo assets

- [x] 5.1 Regenerate the `.github/images/` promo banner and promo tiles with the new seal in place of the old mark, and verify the new images render correctly when previewed (e.g. opening the README locally or on GitHub). Regenerated via a one-off scratch script (per design.md's non-goal, not committed) using resvg with the real Cinzel webfont (downloaded and converted woff2→ttf) — verified visually at all three sizes, including fixing an initial text-overflow at the small tile size.
- [ ] 5.2 **Blocked (tooling gap, not a design decision)**: of the ten `brand-pdf/` images, five show the old header logo and need updating (`01-overview-dark.jpg`, `02-header-crop.png`, `07-overview-light.jpg`, `08-visual-view.jpg`, `10-hover-preview.jpg`); the other five (`03`, `04`, `05`, `06`, `09`) are crops of body content only and are unaffected. The sandboxed browser pane used for verification in this session can display screenshots inline but has no way to save a screenshot to disk at the file's actual resolution — there is no "save this screenshot to a path" tool available, only an in-conversation preview. Regenerating these five images needs either the user manually recapturing them (open the built demo, same steps as the originals) or a follow-up session with a tool that can persist a full-resolution capture.
- [x] 5.3 Update `extension/README.md`'s logo `<img>` reference if its source file path or alt text needs to change, and verify the README renders the new logo when previewed. Verified no change needed: it already points at `public/icons/icon128.png` (regenerated in task 3.3) with a generic, still-accurate alt text.

## 6. Full verification

- [x] 6.1 Run `npm run typecheck`, `npm test`, and `npm run build` (and `npm run build:demo`), and verify all succeed with the new logo in place. All four passed: typecheck clean, 440/440 tests, extension build and demo build both succeeded, `dist/tab.html` and `docs/index.html` both carry the Cinzel `<link>`, and `docs/icons/*` stayed in sync with `extension/public/icons/*` (matching MD5s).
- [x] 6.2 Load the demo page in both light and dark theme (toggle in-app) via the browser pane, and verify the header logo, wordmark, and toolbar icon appear correctly in each theme per the design. Verified for the built demo: dark theme shows the dark-plate/gold-stroke seal with the Cinzel wordmark; toggling to light theme correctly re-themes the seal (light plate, darker gold stroke) via the existing CSS-variable mechanism, with no code branching. **Not verified**: loading the actual unpacked extension in real Chrome (see task 3.4) — the browser pane used here is sandboxed and separate from Chrome, so it can't load unpacked extensions or the toolbar icon; that step needs manual verification by the user.
