## Context

See proposal.md for motivation. This builds directly on `fix-mana-cost-hybrid-and-dfc-symbols` (not yet archived at the time of writing): that change established `mana-cost.ts`'s canonical symbol-code vocabulary (plain digits, single WUBRG/X/Y/Z/C/S letters, two-color hybrid as a slash-free alphabetically-sorted pair like `"BG"`, Phyrexian as `"BP"`), `ManaCostIcons`' hotlinked rendering of those codes, and — critically — the finding this change exists to fix: LigaMagic's own `.deck-cmc` markup concatenates a multi-face card's costs with no reliable in-page signal for where one face ends and the next begins, and that unreliability doesn't correlate cleanly with Scryfall's `layout` field (the same layout value behaves inconsistently across different real cards).

Relevant existing shape:
- `CardEnrichment` (`extension/src/lib/deck/types.ts`) currently carries `layout` but no mana-cost data at all — mana cost has been page-capture-only up to this point, deliberately, to avoid a Scryfall dependency for the common case.
- `ScryfallClient.toEnrichment` (`extension/src/lib/scryfall/client.ts`) maps a raw Scryfall card response to `CardEnrichment`; the raw response already includes `card_faces[]` when relevant (used today only for `resolveImageUrl`'s fallback), each face optionally carrying its own `mana_cost` string in Scryfall's own bracket notation (e.g. `"{2}{G/U}{G/U}"`), empty (`""`) when that face has no printed cost.
- `CardRow.tsx`'s `DOUBLE_FACED_LAYOUTS` set (currently `{"split"}`) gates whether `ManaCostIcons` renders the page-captured `pageManaCostSymbols` at all — this change replaces that mechanism.

## Goals / Non-Goals

**Goals:**
- Any card with more than one real printed mana cost shows every real cost, correctly, separated — not a guess, not a concatenated jumble, not nothing.
- Reuse the existing canonical symbol-code vocabulary and `ManaCostIcons` rendering rather than inventing a parallel system.

**Non-Goals:**
- Changing single-cost cards' behavior at all — they keep using page-captured `pageManaCostSymbols` exactly as today; this change only engages once a card is confirmed (via enrichment) to have more than one real cost.
- Indicating which face is "currently" the front/active one, or reordering faces — always show every real cost in the card's own face order, since a deckbuilder is a reference view, not a battlefield state.
- Changing `deck-page-capture` or `mana-cost.ts` (the page-DOM decoder) at all — page capture remains untouched and remains the source for the common (single-cost) case.

## Decisions

**Fetch each face's raw Scryfall mana-cost string; parse it with a new function, not by extending `mana-cost.ts`.**
`mana-cost.ts` is documented as decoding LigaMagic's own page markup specifically ("no Scryfall dependency"); folding a Scryfall-format parser into it would blur that boundary. A new small function (e.g. `parseScryfallManaCost` in a new `extension/src/lib/scryfall/mana-cost.ts`) converts Scryfall's bracket notation (`"{2}{G/U}{G/U}"`) into the same canonical symbol-code vocabulary `ManaCostIcons` already renders (`["2", "GU", "GU"]`), so `ManaCostIcons` itself needs no format-awareness — it only ever sees canonical codes, regardless of source.

**Canonicalizing Scryfall's hybrid notation requires sorting, not just stripping the slash.** Scryfall's own bracket notation always includes the slash (`{G/U}`, `{B/P}`) — unlike LigaMagic's asset filenames, which have none. Stripping the slash from `{B/P}` (Phyrexian, letter-then-P, never reordered) directly matches the existing canonical `"BP"`. But a two-color hybrid symbol's *printed* order follows each card's own convention (Scryfall's data isn't guaranteed alphabetical), so `{W/B}` and `{B/W}` need to collapse to the *same* canonical code — sort the two color letters alphabetically (matching the `b < g < r < u < w` convention `mana-cost.ts` already established from live LigaMagic data) before concatenating, so both produce `"BW"` and resolve to the identical, already-correct asset URL.

**`CardEnrichment` gains `faceManaCosts: string[][] | undefined`** — an array of per-face canonical symbol arrays (e.g. `[["2","GU","GU"], ["1","GU","GU"]]` for Thranduil), already parsed at enrichment time via `parseScryfallManaCost`, not raw Scryfall strings. Populated only when Scryfall reports more than one face with a non-empty `mana_cost`; `undefined` otherwise (including for transform/meld cards, whose back face has no cost to report). Parsing once at enrichment time — rather than storing raw strings and parsing on every render — keeps `CardRow`/`ManaCostIcons` free of Scryfall-format knowledge, mirroring how `pageManaCostSymbols` is already parsed once at capture time.

**`ManaCostIcons` gains an alternate `symbolGroups: string[][]` prop, rendered with a `//` divider between groups, instead of a second component.** One component keeps all mana-cost-icon presentation (pip sizing, hotlinking, alt text) in one place. `//` was chosen over `|` as the divider: it matches the separator LigaMagic's and Scryfall's own card names already use for these same cards (e.g. "Thranduil, Sindarin Liege // Silvan Rally"), so it reads as continuing a convention the user already sees elsewhere in the app, not introducing a new one.

**`CardRow` prefers `card.enrichment.faceManaCosts` over `card.pageManaCostSymbols` whenever it's present; `DOUBLE_FACED_LAYOUTS`-based suppression is removed entirely.** Once real per-face data exists, there's no more need for the fragile layout-name heuristic `fix-mana-cost-hybrid-and-dfc-symbols` used — every multi-cost card is now handled correctly and uniformly, not layout-by-layout. Before enrichment resolves, `CardRow` still falls back to `pageManaCostSymbols` (the existing "flash the page-captured value, then settle" behavior, now settling to *correct* multi-face icons instead of hidden ones).

## Risks / Trade-offs

- **A multi-face card still briefly shows the page's own (possibly wrong) concatenated cost before enrichment resolves.** Mitigation: accepted, same as the enrichment-delay trade-off already accepted elsewhere (color rail, illegal badge, and the prior change's split-suppression) — it settles to correct, it just isn't instant.
- **One more Scryfall response field to keep in sync with `card-data-service`'s existing batched-request design.** Mitigation: `card_faces` is already present in every card response `ScryfallClient` receives today (used for `resolveImageUrl`'s DFC fallback) — this adds a second read of already-fetched data, not a new request shape or an additional round trip.
- **The alphabetical-sort assumption for hybrid canonicalization carries the same unverified-pair risk `fix-mana-cost-hybrid-and-dfc-symbols` already accepted for the LigaMagic-side table** (only `bg`/`gu` are directly confirmed there). If sorting a Scryfall pair produces a code that doesn't match LigaMagic's real asset naming for that pair, the icon 404s for that specific hybrid combination — same class of risk, same mitigation (safe to correct once a real mismatch is observed; `ManaCostIcons` already degrades to a broken image rather than crashing).
