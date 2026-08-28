## Context

See `proposal.md` - Why. Two relevant precedents already exist in the codebase:

- `use-theme-preference.ts` — a persisted-preference hook backed by `ChromeLocalStore`, read once on mount and overridable by the user, whose result is written to `document.documentElement.dataset.theme`. This change follows the same persisted-preference shape but without theme's OS-preference detection (there is no browser signal for "preferred card-name language").
- `TYPE_DISPLAY_LABELS` / `COLOR_GROUP_DISPLAY_LABELS` in `group-sort.ts` — an existing pattern of keeping a canonical English key separate from a Portuguese presentation label, used for group headers and chart buckets. The same separation (canonical value vs. display value) is the shape this change uses for card names.

`groupAndSortZone` (`group-sort.ts`) is a pure function of `(cards, groupingAxis, sortAxis)`, recomputed fresh on every render from React state owned by `TabRoot.tsx` — there is no persisted "current sort order," only persisted *axis selections*. The grouping/sort-axis controls are native `<select>` elements (`TabRoot.tsx:264-284`).

Both `deck-page-parser.ts` and `collection-page-parser.ts` already extract a card's canonical English name from its link `href`, with the anchor's own visible (Portuguese) text used only as a same-value fallback when `href` parsing fails.

## Goals / Non-Goals

**Goals:**
- Capture and expose LigaMagic's Portuguese display name without touching the meaning of the existing canonical `name` field.
- Keep every non-display consumer of card names (Scryfall lookup, dedup/grouping, budget, legality, export) unaware that a second name exists at all.
- Make the Name-axis sort's toggle-snapshot behavior an explicit, visible piece of UI state, not an implicit timing quirk.

**Non-Goals:**
- No change to how names are grouped/deduped/keyed — that remains exclusively the canonical English `name`.
- No attempt to source Portuguese names from anywhere other than the page itself (no Scryfall `printed_name` lookup, no bundled translation table) — the page already has this data for free.
- No change to the grouping-axis control or its `<select>` presentation.

## Decisions

### Add `pageNamePt` as a new optional field, not a `name`/`namePt` split
`CapturedCard` gains `pageNamePt: string | undefined`, following the same "page-captured, may be absent" shape as `pageLowestPrice`, `pageImageUrl`, and `pageManaCostSymbols`. The existing `name` field's meaning (canonical English) is unchanged.

**Alternative considered:** rename `name` to something like `nameEn` and require every callsite to pick a variant explicitly. Rejected — it would force a mechanical touch of every identity-sensitive consumer (Scryfall client, legality, budget, dedup/grouping keys) for no behavioral gain there, and invites a future bug where one of those call sites is migrated to the wrong variant by accident. Adding a field instead means the identity-sensitive code doesn't change at all; only the display/sort/filter layers that need to be language-aware touch the new field.

### `pageNamePt` capture mirrors the existing fallback exactly
In both parsers, whenever `extractCardNameFromHref(href)` succeeds, the anchor's `textContent` (already being read today, just discarded) becomes `pageNamePt`. When it fails, both `name` and `pageNamePt` fall back to the same `textContent` value — i.e., the pre-existing fallback path now populates both fields with what is, in that edge case, the same (Portuguese) string. This makes the pre-existing "English name field sometimes silently holds Portuguese text" edge case visible and consistent rather than a hidden inconsistency.

### Display resolution is one small helper, called from three render sites
A `displayName(card: { name: string; pageNamePt?: string }, language: NameLanguage): string` helper (`language === "pt" ? (card.pageNamePt ?? card.name) : card.name`) is the single place display language is resolved, falling back to English when no Portuguese name was captured. It is called from `CardRow.tsx` (row text + hover preview text), and `CardVisualTile.tsx` (caption text) — the same three touchpoints `localization`'s existing "Card names stay untranslated" scenario already names. The active language is threaded down from `TabRoot.tsx` as a prop, the same way `sortAxis` and `groupingAxis` already are.

**Alternative considered:** resolve the display name once per card at the `useTabDeck`/`DeckCard` level and store it as a computed field. Rejected — that would require re-deriving the whole card list on every toggle flip and risks the derived field leaking into a non-display consumer by accident (e.g. an export or filter path that grabs the "obvious" name field instead of the canonical one). A pure per-render helper called only at the three known display sites keeps the toggle's blast radius exactly as small as the proposal describes.

### Toggle control: a text button, not an icon
Unlike light/dark (sun/moon icons are self-explanatory), a flag or generic globe icon would be ambiguous or actively misleading for a language choice (Portuguese isn't tied to one flag, and an EN/PT choice isn't visually obvious from a globe). The control is a small text button in the header, next to the theme toggle, showing the language it will switch *to* — "PT" while English is active, "EN" while Portuguese is active — mirroring the existing theme toggle's own convention of showing the destination state, not the current one.

### `compareByName` gains a language parameter; the tiebreak call stays hardcoded English
`compareByName(a, b, language)` in `group-sort.ts` is used two ways today: as the primary comparator when `sortAxis === "name"`, and as the trailing tiebreak inside `sortWithinGroup` for every axis. Only the first call site passes the active sort-name-language; the tiebreak call site always passes `"en"` explicitly (not a default parameter value, so it stays correct even if the primary call site's signature changes later). This keeps the tiebreak's behavior spec-compliant (English-always, per `deck-organizer`'s modified requirement) without needing two separate comparator functions.

### The Name-axis language is snapshotted in `TabRoot`'s own state, not inside `group-sort.ts`
`group-sort.ts` stays a pure function with no notion of "when" a selection happened. `TabRoot.tsx` adds a second piece of state, `sortNameLanguage: NameLanguage`, alongside the existing `sortAxis` state. The sort-axis `<select>`'s `onChange` handler sets both `sortAxis` and `sortNameLanguage` (the latter to the toggle's *current* live value) on every change event. Flipping the name-language toggle afterward updates the live toggle value but leaves `sortNameLanguage` — and therefore the rendered order — untouched, exactly matching the spec's "does not re-sort until the next interaction with the sort-axis control."

### Re-selecting "Name" while already selected: a resync hint, not a control rewrite
A native `<select>` does not fire `onChange` when the user picks the option that's already selected, so the spec's "re-selecting Name re-syncs" scenario needs a second affordance rather than relying on that event. Per the user's decision: the `<select>` stays as-is; when `sortAxis === "name"` and the live name-language toggle differs from the snapshotted `sortNameLanguage`, a small inline hint (e.g. a "↻" button) appears next to the sort control. Activating it re-snapshots `sortNameLanguage` to the current toggle value. This is additive UI, scoped to the one axis that needs it, and leaves the grouping-axis control and the sort-axis control's general shape untouched.

### Filter matches both names unconditionally
`ZoneSection.tsx`'s existing per-zone filter (`c.name.toLowerCase().includes(trimmedFilter)`) becomes `c.name.toLowerCase().includes(trimmedFilter) || (c.pageNamePt?.toLowerCase().includes(trimmedFilter) ?? false)`. This needs no language-state threading at all — both names are always checked, regardless of the active toggle — so it is the simplest change in the whole proposal.

### Export needs no code change, only a regression test
`generate-decklist.ts` already builds its output from `card.name` exclusively. Since `pageNamePt` is a wholly new, separate field, export is unaffected by construction. A test asserting the export ignores an active Portuguese toggle (i.e., exercises a card with a `pageNamePt` set and confirms it doesn't appear in the export) guards against a future regression rather than fixing a present bug.

## Risks / Trade-offs

- **[Risk]** A card captured before this change (i.e., an already-open full-tab view mid-session, or a stale cached capture) has no `pageNamePt`. → **Mitigation**: `displayName` falls back to `card.name` whenever `pageNamePt` is `undefined`, so switching to Portuguese on stale data silently shows English for that card rather than erroring or showing "undefined."
- **[Risk]** The resync-hint affordance is a new, small UI element that's easy to overlook, so a user might not realize why their Name-sorted zone didn't reorder after toggling language. → **Mitigation**: this is the explicit trade-off the user chose over a bigger control rewrite; the hint only needs to be noticeable, not load-bearing, since the underlying order is never wrong, only stale until the next deliberate sort-axis interaction.
- **[Risk]** `pt-BR` string comparison for the Name axis (accented characters like "É", "Í", "Ç") may sort differently than plain `String.prototype.localeCompare` without an explicit locale. → **Mitigation**: `compareByName` passes an explicit `"pt-BR"` locale to `localeCompare` when comparing Portuguese names (and keeps the default/`"en"` locale for English), so accented names collate the way a Portuguese speaker expects rather than falling out of native code-point order.

## Migration Plan

No data migration: `pageNamePt` is a new optional field with no existing persisted state to backfill (captures are re-derived live from the page on every activation, per `deck-page-capture`'s sync requirement). The name-language preference defaults to English with no stored key present, matching current behavior exactly until a user opts in. No rollback concerns beyond a normal revert.
