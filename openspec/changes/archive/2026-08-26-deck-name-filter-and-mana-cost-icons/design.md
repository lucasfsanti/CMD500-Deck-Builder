## Context

Two independent features land together because they were explored together, not because they share code: a per-zone name filter (touches `deck-organizer`'s grouping/rendering path) and mana-cost icons in List view (touches `deck-page-capture`'s extraction path and `card-visual-view`'s rendering path). See proposal.md for motivation; this covers how each is built.

Relevant existing shape:
- `deck-page-parser.ts` extracts `CapturedCard` fields (`name`, `quantity`, `zone`, `pageLowestPrice`, `pageImageUrl`) directly from the live, styled `document.body` — it runs as a content script via `watchPage`, not against a detached HTML snapshot, and re-runs on async page reloads.
- `groupAndSortZone` (group-sort.ts) already drops any group bucket that ends up with zero cards — grouping only ever pushes non-empty buckets.
- `ZoneSection` already has zone-scoped presentational flags (`hero`, `multiColumn`) set per call site in `TabRoot`; it isn't a dumb list renderer, it already varies behavior per zone.
- On the live LigaMagic deck page, each card row carries mana cost as `.deck-box-right > .deck-cmc > .txt-mana > abbr.mtg-symbol`, one `<abbr>` per pip, in cost order. Each `<abbr>` carries only a Portuguese word-slug class (`mtg-symbol-dois`, `mtg-symbol-g`) — no `title`/`data-*` attribute, no inline `style`. The symbol's real identity (e.g. `2`, `G`, `X`) is only exposed through the *computed* `background-image`, resolved from an external stylesheet rule keyed by that class, pointing at `https://www.ligamagic.com.br/arquivos/img/mtg/symb/<code>.svg`. Rows with no mana cost (lands) have no `.deck-cmc` content at all.
- Verified directly against the live site: plain numeric/color slugs are simple and consistent (`mtg-symbol-um`→`1`, `mtg-symbol-dois`→`2`, ... `mtg-symbol-g`→`G`, `mtg-symbol-u`→`U`, `mtg-symbol-x`→`X`), hybrid mana (`Boros Charm`, `{R/W}{R/W}`) renders as two plain single-letter abbrs (`mtg-symbol-w`, `mtg-symbol-r`) rather than a compound hybrid slug, and Phyrexian mana (`Dismember`, `{1}{B/P}{B/P}`) is the one case that needs its own compound entry (`mtg-symbol-bp`).
- `deck-page-parser.test.ts` fixtures are parsed via `new DOMParser().parseFromString(html, "text/html")` — a **detached** document. Checked empirically (a throwaway jsdom script): `getComputedStyle` returns `"none"` for an element in a detached document even when the same HTML string carries a matching `<style>` rule; it only resolves once the element is attached to `window.document`. Production capture runs against the live, attached `document.body`, so this only breaks *testing* the extraction the way every other capture field is tested here — not production behavior.

## Goals / Non-Goals

**Goals:**
- Independent, per-zone name filter for Main Deck and Maybeboard that's purely a display concern.
- Capture each card's mana cost from LigaMagic's own page markup at parse time, and show LigaMagic's own official icons for it in List view rows.

**Non-Goals:**
- No Scryfall-based mana cost enrichment — deliberately avoided; the data is already on the page.
- No mana cost display outside List view (Visual view grid tiles, the Commander hero block) — out of scope per the proposal's "text visualization" framing.
- No fuzzy or accent-insensitive name matching for the filter — plain case-insensitive substring match on the already-captured canonical (English) card name.
- No self-hosted copy of the mana symbol asset set — icons are hotlinked from LigaMagic, not bundled.
- No change to how budget, card count, or legality are computed — the filter never touches that path.

## Decisions

**Mana cost extraction decodes the `<abbr>` class-name slug directly, not the computed `background-image`.**
Reading the resolved `background-image` was the first instinct — it passes through whatever LigaMagic's stylesheet already resolved, no table to maintain — but it only resolves for an element attached to `window.document`; a detached document (exactly what `DOMParser().parseFromString()` produces, and exactly what `deck-page-parser.test.ts` uses for every existing fixture) always reports `"none"`, confirmed empirically. That makes the extraction untestable the way every other capture field here is tested, for a real production dependency (stylesheet load timing) that's otherwise invisible until it breaks. Decoding the class slug instead needs a small lookup table, but is self-contained, has no load-order dependency, and is testable with a plain HTML fixture like everything else `deck-page-parser.ts` extracts. The table covers what was verified against the live site: Portuguese number words for generic costs (`um`→`1`, `dois`→`2`, ...), single letters for W/U/B/R/G/X/Y/Z (the slug already *is* the lowercased code, e.g. `g`→`G`), and Phyrexian compounds (`bp`→ black Phyrexian) added as they're seen. Hybrid mana needs no special-casing — LigaMagic renders it as separate plain-letter pips (`Boros Charm`'s `{R/W}{R/W}` is four ordinary W/R abbrs), not a compound slug.
If any single pip's class doesn't match a known entry, the *whole card's* mana cost is captured as unresolved (`undefined`), not a partial or guessed cost — same "absence over wrong data" rule the price extraction already follows for an unshown price. The table is additive: an unrecognized symbol degrades a card to "no mana cost shown" rather than breaking capture, so it can be extended later without a migration.

**Captured shape is an ordered array of symbol codes, not a raw cost string.**
`CapturedCard` gains `pageManaCostSymbols: string[] | undefined` (e.g. `["2", "G", "U", "R"]`), `undefined` for cards with no cost (lands) — following the same `page`-prefixed naming `pageImageUrl`/`pageLowestPrice` already use for "captured straight off the page, no Scryfall dependency." An array of already-resolved codes was chosen over a Scryfall-style `"{2}{G}{U}{R}"` string because rendering needs one icon per code anyway; a string would just add a parse step back in for no benefit, and would invite confusion with Scryfall's own `mana_cost` format on a field that never touches Scryfall.

**Icons are hotlinked directly from LigaMagic's asset host.**
Same precedent as `extractPageImageUrl`/`resolveCardArt`: reference LigaMagic's own SVG URL directly rather than bundling a copy of the official Wizards symbol set into the extension. Keeps the icons pixel-identical to LigaMagic's own page (the explicit ask) with zero asset maintenance.

**Mana cost renders in its own component, used only by `CardRow`.**
A small presentational component (rendering one `<img>` per captured symbol code) is added and wired into `CardRow` only, not `CardVisualTile`. Keeping it out of the shared render path (rather than adding a prop to suppress it in Visual mode) makes the List-only scope structural, not conditional.

**Filter text is local `ZoneSection` state, gated by a new `filterable` prop.**
Nothing outside a zone's own render needs its filter text — budget, card count, and legality are already computed in `TabRoot` off the full, unfiltered `cards` array, independent of what any zone chooses to display. So filter text lives in a `useState` inside `ZoneSection` itself, with a new `filterable?: boolean` prop (parallel to the existing `hero`/`multiColumn` flags) set on the Main Deck and Maybeboard call sites in `TabRoot` only. This avoids threading two independent filter strings through `TabRoot` for no one else to read.

**Filtering happens before grouping, not after.**
`ZoneSection` filters its `cards` prop by substring match (case-insensitive) before calling `groupAndSortZone`, rather than building groups first and then pruning empty ones. Since every `groupBy*` function already skips buckets with zero cards, filtering upstream gets "groups with no matches disappear" for free — no separate empty-group-hiding logic needed. The zone's header count is computed off this same filtered array, so it reflects what's actually visible.

## Risks / Trade-offs

- **A card uses a mana symbol whose slug isn't in the table yet** (an exotic Phyrexian color, snow, or a symbol pattern not yet seen) → that card shows no mana-cost icons rather than a wrong or partial cost. Mitigation: this degrades the same way an unshown price or missing artwork already does — visibly absent, never silently wrong — and the table is a plain, additive lookup, so a newly observed slug is a one-line addition, not a redesign.
- **LigaMagic changes its mana-cost markup** (`.deck-cmc` structure, or the class-naming scheme) → mana cost silently stops appearing, same fail-soft behavior as a card missing artwork today. Isolating extraction in its own helper keeps this from affecting name/quantity/zone/price capture.
- **Hotlinked icons 404 or LigaMagic rate-limits/blocks the asset host** → a broken `<img>`, same as an artwork hotlink failing today; no dedicated fallback exists for that case, consistent with existing behavior.
- **Per-zone filter state resets on remount** → acceptable today since nothing remounts `ZoneSection`, but a future change that keys/remounts zone sections (e.g. for animation) would silently clear filter text; worth a comment at the `useState` call site.
