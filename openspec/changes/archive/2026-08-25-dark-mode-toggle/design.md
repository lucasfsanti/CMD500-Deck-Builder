## Context

See proposal.md - Why for the motivation. Relevant current-state facts:

- `panel.css`'s entire "Night Ledger" palette lives as one unguarded token block on `:host, :root` (lines 27-89) — there is no theme variation today, no `prefers-color-scheme` handling, and `color-scheme: dark` is hardcoded.
- `:host` is carried alongside `:root` throughout the file for a shadow-DOM overlay panel that no longer exists (`content-script.ts` mounts no UI); `tab.html`'s own document is what actually renders `TabRoot`, so in practice only `:root` (i.e. `document.documentElement`) is live today. The dual selector costs nothing to keep and matches the file's existing convention.
- `extension/src/lib/scryfall/cache.ts` already wraps `chrome.storage.local` behind a small `KeyValueStore` interface (`ChromeLocalStore`/`MemoryStore`); `extension/src/lib/deck/format-storage.ts` already uses that exact interface to persist a single preference value (a deck's chosen format) with an injectable `store: KeyValueStore` parameter, so tests can inject a fake instead of stubbing `globalThis.chrome` — this new hook follows that same established persistence pattern rather than `use-source-tab-status.ts`'s bespoke `TabsStatusApi` (that one wraps a live, event-emitting `chrome.tabs` surface, not a plain key-value read/write).
- The previous "Ledger, Reforged" light palette (warm parchment, `#ece0c8`/`#f7f0de`) was fully replaced during the dark redesign and no longer exists anywhere in the codebase — per the proposal, it is not being revived; the light-mode tokens below are a fresh design pass in the same "Night Ledger" hue language, just inverted for a light canvas.

## Goals / Non-Goals

**Goals:**
- A light-mode token set that reuses the same mana-color-doubles-as-status-color concept and hue families as dark mode, re-tuned for contrast against a light canvas.
- Theme resolution that layers cleanly: explicit user choice > OS preference > dark fallback, with no flash-of-wrong-theme on load.

**Non-Goals:**
- No per-component light/dark variants beyond CSS custom properties — every component already reads color exclusively through `--c500-*` tokens, so no component file needs to change, only `panel.css`'s token layer and one new toggle control.
- No system-theme change-tracking once a manual choice exists — per the spec's "Manual theme choice persists and overrides OS preference" requirement, a live OS theme change after a manual pick should NOT flip the panel; only the pre-manual-choice state listens to `prefers-color-scheme` live.

## Decisions

**Token layering: unguarded dark base, `prefers-color-scheme` media override, `data-theme` attribute override.** Three layers, in ascending precedence:
1. The existing dark tokens stay exactly as-is, unguarded on `:host, :root` — zero risk to today's look for anyone who never touches the toggle and whose OS is dark (the common case, since dark is the fallback).
2. A `@media (prefers-color-scheme: light)` block, scoped to `:root:not([data-theme="dark"]), :host:not([data-theme="dark"])`, applies the new light tokens when the OS prefers light and the user hasn't manually forced dark.
3. `:root[data-theme="light"], :host[data-theme="light"]` applies the light tokens unconditionally — wins over the OS preference once the user manually picks light. No equivalent `[data-theme="dark"]` token block is needed (dark is already the unguarded base); that attribute value only exists so the media-query guard in layer 2 has something to check against once the user manually picks dark.

This mirrors a well-established three-layer theming pattern (default tokens → OS-preference media query → explicit override attribute) rather than inventing a bespoke scheme.

**`data-theme` lives on `document.documentElement`, set by a new `useThemePreference` hook.** Not on `.c500-tab` itself — `document.documentElement` is what the `:root` CSS selector actually matches. The hook's initial React state already guesses from `matchMedia` synchronously (before any effect runs) to minimize a flash of the wrong theme; an effect then syncs `theme` to the DOM attribute on mount and on every change. The hook persists via the existing `KeyValueStore` interface (`ChromeLocalStore` by default, matching `format-storage.ts`'s pattern — see Context above), not a bespoke storage type. Resolution order: stored preference, if any → live `matchMedia('(prefers-color-scheme: light)')` result, if no stored preference → `"dark"` fallback if `matchMedia` itself is unavailable. While no manual preference is stored, the hook keeps listening to the media query's `change` event so the panel tracks a live OS theme change; once the user toggles (or a stored preference loads), that listener is torn down (per the Non-Goal above) and only the stored value matters from then on.

**New light-mode tokens** (contrast-checked at ≥4.5:1 against both `--c500-bg` and `--c500-bg-raised`, same bar the dark palette's own comment holds itself to):

| Token | Dark (existing) | Light (new) | vs bg | vs bg-raised |
|---|---|---|---|---|
| `--c500-text` | `#e8e6e3` | `#1a1a1d` | 14.6:1 | 17.4:1 |
| `--c500-text-soft` | `#8f8d89` | `#6b6a68` | 4.5:1 | 5.4:1 |
| `--c500-bg` | `#17171b` | `#ecebe7` | — | — |
| `--c500-bg-raised` | `#1f1f24` | `#ffffff` | — | — |
| `--c500-line` | `#2c2c32` | `#d8d6d1` | (hairline border, not text — no contrast bar) | |
| `--c500-mana-w` | `#cfc6b8` | `#726451` | 4.8:1 | 5.7:1 |
| `--c500-mana-u` | `#7897b3` | `#3f6a8a` | 4.8:1 | 5.8:1 |
| `--c500-mana-b` | `#9b87a8` | `#5b4a66` | 6.7:1 | 8.0:1 |
| `--c500-mana-r` | `#c17662` | `#a1503c` | 4.7:1 | 5.6:1 |
| `--c500-mana-g` | `#6b9080` | `#3f6d5a` | 5.0:1 | 5.9:1 |
| `--c500-mana-gold` | `#c9a463` | `#7f5e26` | 5.0:1 | 6.0:1 |
| `--c500-mana-c` | `#9a958a` | `#6e6a60` | 4.5:1 | 5.4:1 |
| `--c500-mana-land` | `#a68a6b` | `#7a5f43` | 5.0:1 | 5.9:1 |
| `--c500-price` | `#d1a866` | `#7a5b19` | 5.3:1 | 6.3:1 |
| `--c500-status-good-soft` | `rgba(107,144,128,0.16)` | `rgba(63,109,90,0.14)` | (soft background tint, not text) | |
| `--c500-status-bad-soft` | `rgba(193,118,98,0.16)` | `rgba(161,80,60,0.14)` | (soft background tint, not text) | |
| `color-scheme` | `dark` | `light` | | |

Same relationship as dark mode's `bg`→`bg-raised` step (raised = visually lighter than base) is preserved: light mode's `bg` is a soft warm-cool gray and `bg-raised` is pure white, so headers/cards still read as "raised" above the page.

**Toggle control placement and shape: an icon button in the header, next to the format selector.** Matches the existing view-mode toggle's own pattern (`ListIcon`/`GridIcon` buttons with `aria-label`, no visible text) rather than introducing a new control style — a sun/moon icon button, `aria-label` reflecting the theme it would switch *to* (e.g. "Mudar para tema claro" / "Mudar para tema escuro"), `aria-pressed` omitted since it isn't a binary toggle-state-of-itself but an action button that changes an external, already-observable state (the whole page's colors).

## Risks / Trade-offs

- **[Risk]** Reading `chrome.storage.local` is asynchronous, so the very first paint happens before the stored preference is known — a user with a stored light preference on a dark-OS machine could see one dark frame before it flips to light. → **Mitigation:** accept this for v1 (the existing `use-tab-deck`/`use-source-tab-status` hooks already have similar one-frame-late patterns for their own async reads); revisit with a `chrome.storage`-backed sync read or a pre-render inline script only if it proves visually distracting in practice.
- **[Risk]** `window.matchMedia` or `chrome.storage` may be unavailable in the test environment (jsdom) or a non-extension context, mirroring the same class of risk `getExtensionVersion()` already guards against in `TabRoot.tsx`. → **Mitigation:** guard both lookups (`typeof window.matchMedia === "function"`, injectable storage API defaulting to `chrome.storage.local`) and fall back to the dark theme rather than throwing.

## Migration Plan

Browser extension, no persisted-data shape change beyond one new `chrome.storage.local` key — CSS token additions and one new hook/control. "Deploy" is shipping the next extension version; "rollback" is reverting the commit. An existing installed user with no stored preference is unaffected (falls through to OS-preference-or-dark, same visual result as today for anyone on a dark OS).
