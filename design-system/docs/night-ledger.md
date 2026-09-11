# Night Ledger — CMD500 Deck Builder design system

The design system for CMD500 Deck Builder's full-tab deck view (a Chrome
extension that turns a LigaMagic deck page into a Commander 500 / Commander
500 Duel deck-building tool: real-time budget tracking, legality checks,
drag-and-drop zone organization, composition charts, and export).

## Concept

One accent palette does double duty as both the budget ledger's status
colors and Magic's five-color mana pie, instead of running two competing
color systems side by side. Muted forest green is simultaneously "under
budget / legal" and green mana. Muted rust is simultaneously "over budget /
illegal" and red mana ("in the red," literally). Muted brass is
simultaneously the price/foil accent and multicolor gold. Only white, blue,
and black are net-new hues introduced purely for mana identity.

The signature is two-part:
- **The ledger tape** — a full-width strip fusing budget, card count,
  legality, and export into one quiet toolbar.
- **The color rail** — a colored left-edge keyline on every card row/tile,
  echoing a real Magic card's colored frame border, that carries color
  identity at a glance.

Visual language is deliberately minimal: near-black, cool-neutral canvas,
desaturated accents, no serif type, no divider lines on the ledger tape,
lower saturation overall — so the *functional* color (the rail, the gauges,
the price figures) is the only thing that reads as an accent. This was a
considered pivot away from an earlier warm-parchment direction that,
however careful, still read as a generic AI-design default.

## Color tokens

All tokens are CSS custom properties (`--c500-*`), defined once for dark
(the default) and re-defined for light — both `@media (prefers-color-scheme:
light)` and an explicit `[data-theme="light"]` override. Every token pair is
contrast-checked at ≥4.5:1 against both `--c500-bg` and `--c500-bg-raised`.

| Token | Role |
|---|---|
| `--c500-text` / `--c500-text-soft` | Primary / muted body text |
| `--c500-bg` / `--c500-bg-raised` | Page canvas / card & panel surface |
| `--c500-line` | Hairline borders and dividers |
| `--c500-mana-w/u/b/r/g` | Mana-color identity (White/Blue/Black/Red/Green), also doubling as status color where noted below |
| `--c500-mana-gold` | Multicolor identity **and** the price/foil accent family |
| `--c500-mana-c` | Colorless spells/artifacts |
| `--c500-mana-land` | Lands — deliberately distinct from `--c500-mana-c` so the two read as separate categories in charts |
| `--c500-price` | Dedicated price color, decoupled from `--c500-mana-gold` on purpose so tuning one can't drag the other |
| `--c500-status-good-soft` / `--c500-status-bad-soft` | Low-alpha tints of the green/red mana hues for status backgrounds — never solid pastels, which read as washed-out on a near-black base |

Green (`--c500-mana-g`) = "good" (under budget, legal). Rust
(`--c500-mana-r`) = "bad" (over budget, illegal). Reuse this pairing for any
new good/bad indicator rather than introducing a fresh green/red.

## Typography

- Body: system-font stack (`-apple-system, "Segoe UI", Roboto, Helvetica,
  Arial, sans-serif`) — no bundled or CDN-loaded typeface. One grotesk
  carries every text role.
- Numerals: a tabular monospace stack (`ui-monospace, "SF Mono", "Cascadia
  Code", Consolas, monospace`), reserved for numbers only, so price/budget
  figures line up like a real accounting column.

## Shape language

Rounded rectangles throughout — buttons, cards, the ledger tape itself all
share one corner-radius language. Never force circular crops on brand
artwork or badges; a rounded-square badge matches the rest of the system
better than a circle.

## Theming

Dark is the unguarded default. Light is a full second pass in the same hue
language (not a revival of an earlier "parchment" palette) — re-tuned, not
just inverted, and held to the same ≥4.5:1 contrast bar. A manual
light/dark toggle overrides the OS `prefers-color-scheme` and persists
across tabs.

## Accessibility conventions

- Decorative marks (logo/brand SVGs) are `aria-hidden="true"`; the
  accessible name for a region lives on a real heading (visually hidden via
  clip/absolute-position, never `display:none`/`visibility:hidden`, when it
  shouldn't be shown sighted).
- Status color is never the only signal — pair a color rail/background tint
  with text or an icon, not color alone.

## Language

The in-app UI is **Portuguese (pt-BR) only**, by deliberate, standing
product decision — the entire user base captures decks from a
Portuguese-language site. Compose new screens and copy in pt-BR; don't
introduce English UI strings.

## Where the real tokens live

The canonical, always-current token definitions ship in this bundle's
`styles.css` (via its `@import` of the extension's real `panel.css`) — read
that file, not this summary, before hand-tuning a color.
