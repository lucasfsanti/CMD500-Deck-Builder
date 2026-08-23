## Context

See proposal.md - Why for the root-cause analysis (self-inflicted Scryfall rate-limiting from one request per card, plus a budget-scope rule that was simply wrong). This design covers the four independent fixes that address it.

Confirmed against a real ~90-card deck (`?view=dks/deck&id=10171831`) via a live headless-browser capture: 26 of 87 per-card Scryfall requests returned HTTP 429, and cards that fail are never retried (a card's `enrichmentStatus` only re-enters the lookup-eligible `pending` filter on a fresh capture, not automatically). Separately, LigaMagic's own page DOM was confirmed to embed an artwork image for every one of the 87 distinct cards at initial page load — a hidden per-card tooltip `<img lazy-src="...">`, keyed by the card link's `data-lc-id`, present document-wide with no additional network request needed to read it.

## Goals / Non-Goals

**Goals:**
- Resolve enrichment for a full deck using a small, bounded number of Scryfall requests, independent of deck size.
- Make Visual view's artwork independent of Scryfall's availability, by sourcing it from data already on the page.
- Correct the budget-scope rule to the actual Commander 500 rule (Main Deck + Comandante Parceiro only).
- Generalize the organizer's single hardcoded grouping into a user-selectable axis (Type/Color/Mana Cost), without changing its underlying sort machinery more than necessary.

**Non-Goals:**
- Building a general-purpose retry/backoff system for transient Scryfall failures. Batching should make individual-card failures rare; the existing "reload re-captures everything" path remains the recovery mechanism, consistent with card-data-service's existing degrade-gracefully requirement.
- Adding a "no grouping / flat list" mode. The grouping-axis selector always has one of the three axes active.
- Changing how price data itself is captured or cross-checked (out of scope; per card-data-service's existing "Lowest-price-eligible printings" requirement, the printings-lookup infrastructure exists but isn't wired into normal operation, and this change doesn't touch that).

## Decisions

### Batch-first Scryfall lookup, with fuzzy fallback only for `not_found`
Scryfall's `/cards/collection` endpoint accepts up to 75 card identifiers per request and does exact (case-insensitive) name matching, unlike `/cards/named?fuzzy=`'s typo-tolerant matching. A ~90-card deck's captured names are already Scryfall's own canonical English names (LigaMagic's own card-link URLs encode them), so a batch call should resolve nearly everything directly. The design keeps the existing per-card fuzzy endpoint as a fallback, but scopes it narrowly: only for names the batch call's response explicitly reports as not found, not as a general retry path. This keeps the fuzzy endpoint's typo/formatting tolerance for edge cases while cutting the common case from ~90 requests to 1-2.

**Alternative considered**: drop the fuzzy fallback entirely, since captured names should already be canonical. Rejected — the fallback is cheap (only exercised for the rare not-found case) and preserves behavior for any edge case the original fuzzy-based design was defending against (accents/whitespace already normalized before either path, but split-card front-face-only naming and other quirks are cheaper to keep covered than to re-verify are impossible).

**Alternative considered**: add a generic retry-with-backoff for any failed lookup. Rejected — batching removes the actual failure mode (self-inflicted rate limiting from request volume), so a full backoff/retry system would be solving a problem that should no longer occur in the common case, at real complexity cost. If it turns out real transient failures remain common in practice, that's a signal to revisit as its own follow-up, not to speculatively build now.

### Artwork sourced from LigaMagic's page DOM, Scryfall as fallback only
`CapturedCard` gains a `pageImageUrl` field, resolved at capture time (same pass as name/quantity/zone/price) from the card link's `data-lc-id` against LigaMagic's own embedded tooltip image markup — no extra network request, since the image URL is already present in the DOM (deferred via `lazy-src` until hover, but readable immediately). Visual view prefers `pageImageUrl`, falling back to Scryfall's `imageUrl` only when the page didn't have one. This decouples artwork entirely from Scryfall enrichment's success — a card can show real art even when its type/color/CMC/legality never resolve.

**Alternative considered**: keep artwork sourced from Scryfall only, and just fix the rate-limiting so enrichment (and thus artwork) resolves reliably. Rejected as strictly worse: even with batching, artwork would still be a Scryfall dependency (an outage takes down Visual view's artwork too), when a strictly better, zero-cost source already sits in the page. Read it regardless of whether batching alone would have "been enough."

### Grouping axis: one generalized sort function, not three separate code paths
The organizer's existing `groupAndSortZone` hardcodes "bucket by type, order buckets by TYPE_ORDER, sort within a bucket by color → CMC → name." The design generalizes this to a single parameterized function taking the active axis (`"type" | "color" | "cmc"`), where:
- the bucket key function switches on the axis (primary type / color-identity label / CMC value),
- the bucket *ordering* uses that same axis's own natural order — `TYPE_ORDER` for Type, colorless→W→U→B→R→G→multicolor for Color (the same order `deck-analytics`'s color chart already uses), ascending value for Mana Cost,
- the within-group sort falls through the two axes not used for grouping, in their existing type-then-color-then-CMC priority order minus whichever is active, then name — same shape as today, just re-parameterized.

This keeps one code path instead of three near-duplicates, and preserves the exact current output when the axis is "type" (the default), so no existing grouping-related test changes behavior unless it explicitly opts into a different axis.

**Alternative considered**: three independent grouping functions (one per axis), selected by a switch at the call site. Rejected — the three axes share the same "bucket, order buckets, sort within bucket by the remaining two axes then name" shape; three copies would drift over time for no benefit over one parameterized function.

### Budget zone set: explicit include-list, not exclude-list
`isBudgetCounted` changes from "not a commander zone and not a basic land" to "is Main Deck or Comandante Parceiro, and not a basic land." An include-list reads directly as "these are the zones that count," matching how the corrected rule is actually stated, rather than requiring a reader to infer inclusion from what's left after two exclusions.

## Risks / Trade-offs

- **[Risk] A captured card name that batch-matches the *wrong* Scryfall card** (extremely unlikely given exact matching, but namesakes/reprints across different card objects with identical names don't exist in Scryfall's data model — a name uniquely identifies one Oracle card). → Mitigation: none needed; Scryfall's collection endpoint is exact-match by design, so this isn't a new risk class introduced by batching.
- **[Risk] LigaMagic changes its tooltip markup** (the `sticky_<id>_`/`lazy-src` convention is unversioned, first-party site markup, same category of risk the existing deck-page-parser already carries for its zone/price markup). → Mitigation: artwork capture fails closed to `undefined` (falls through to the existing Scryfall-then-placeholder chain), the same graceful-degradation shape the rest of capture already uses for markup drift.
- **[Risk] Renaming the budget-tracking requirement's title changes what future deltas need to reference.** → Mitigation: this is a one-time, deliberate correction (the old title actively misdescribed the rule going forward); not expected to recur.

## Migration Plan

No production users exist yet (the extension has not been published). Rollout is: implement, rebuild, reload the unpacked extension, verify live against the real deck that surfaced these bugs. No data migration involved — `chrome.storage.session`'s captured-data shape gains one new optional-in-practice field (`pageImageUrl`), and existing cached Scryfall enrichment entries (`chrome.storage.local`, 7-day freshness) remain valid as-is since `CardEnrichment`'s shape is unchanged.
