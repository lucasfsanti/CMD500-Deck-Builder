## Context

See proposal.md - Why for motivation. Two hard external constraints shape this design:

- **LigaMagic exposes no API.** All deck/collection/price data must come from scraping the rendered page DOM (capability: `deck-page-capture`). This is inherently fragile to markup changes.
- **Neither Commander 500 nor Commander 500 Duel publishes its own machine-readable banlist**, but Commander 500's happens to be reachable indirectly: it's a budget overlay on standard Commander, so its banlist is just the official Commander Rules Committee banlist, which Scryfall already mirrors in every card's `legalities.commander` field. Commander 500 Duel is the hard case: it uses the independent Duel Commander banlist (duelcommander.org/banlist), which is larger, adds banned-as-commander/banned-as-companion/offensive-content categories, and is reviewed roughly every two months by that organization — with no API of its own and no Scryfall coverage (Duel Commander is not a Scryfall-recognized format).
- **This iteration builds no backend.** Card enrichment and Commander 500 legality are fetched directly from Scryfall's public API by the extension itself. Commander 500 Duel legality is checked against a maintainer-curated dataset bundled with the extension. A project-hosted database and API (to centralize caching and make banlist updates independent of extension releases) is deferred to future exploration (capability: `card-data-service`).
- Scryfall provides a free public REST API (CORS-enabled, no auth required) under the Fan Content Policy, explicitly for building community tools like this one. Its own live price data is noted as "dangerously stale after 24h," which is fine here since LigaMagic — not Scryfall — is this product's price source; Scryfall is only used for card attributes (type, color identity, CMC, layout, printings) and Commander 500 legality.

## Goals / Non-Goals

**Goals:**
- Ship a working Chrome (Manifest V3) extension, with no separate backend to deploy, that captures, organizes, budgets, and legality-checks a LigaMagic Commander 500 / Commander 500 Duel deck entirely client-side.
- Keep the LigaMagic-scraping layer isolated behind a stable internal interface so markup changes require touching one module, not the whole extension.
- Keep Commander 500 Duel's bundled banlist easy for a maintainer to update and easy for a user to see the freshness of, given it can only change at release time in this iteration.

**Non-Goals:**
- Writing the reorganized deck back into LigaMagic's own editor/save flow (DOM manipulation to trigger LigaMagic's save). Deferred per proposal.md; noted under Open Questions for future exploration.
- Building and hosting a project-owned backend and database for card or banlist data in this change. This was the original design (see superseded decision below) and remains desirable — it removes the release-cycle coupling on Duel Commander banlist updates and lets card lookups be cached server-side — but is deferred to future exploration per the user's direction to start with direct API calls.
- Firefox support in this change (architecture avoids Chrome-only APIs where cheap to do so, but no Firefox build/testing is in scope).
- Supporting Magic formats other than Commander 500 / Commander 500 Duel.
- Building tournament/event tooling (price locking at registration, pairings, etc.) — this is a personal deckbuilding tool.

## Decisions

### Extension architecture: content script + background service worker + injected panel UI
The content script owns DOM reading/parsing (`deck-page-capture`) and exposes captured state to a background service worker, which talks to the backend (`card-data-service`). The organizer/budget/legality/export UI (`deck-organizer`, `budget-tracking`, `format-legality`, `deck-export`) renders as an injected panel alongside LigaMagic's page rather than a separate popup, so the user sees deck state and LigaMagic's page at once — matching the Moxfield-style "always visible" builder experience the proposal asks for.

**Alternative considered**: popup-only UI (extension icon opens a separate window). Rejected because it breaks the live, side-by-side workflow implied by "moving cards... using drag and drop" while looking at the deck.

### Scraping isolation: a single adapter module per LigaMagic page type
`deck-page-capture` is implemented as a small set of pure parser functions (deck-page parser, collection-page parser) with a defined output contract (list of `{name, quantity, zone, lowestPrice}`), unit-tested against saved HTML fixtures. Nothing else in the extension touches `document` directly.

**Why**: LigaMagic markup changes are the single biggest ongoing maintenance risk. Isolating the parsing surface means a breakage is a fixture-test failure in one module, not a silent bug spread across the organizer.

### Card data access: direct client-side Scryfall calls, no owned backend (superseded original decision)
The extension calls Scryfall's public API directly, per card, for enrichment (type, color identity, CMC, layout, printings) and for Commander 500 legality (Scryfall's `legalities.commander` field). Results are cached in browser local storage with a freshness window to avoid re-querying Scryfall on every deck view and to stay within its fair-use rate limits. No project-owned backend or database is built in this change. The extension calls this — and only this — external API for enrichment and legality data; it never calls anything for price, which always comes from the live LigaMagic page per capability `deck-page-capture`.

**Why this supersedes the original "own database" decision**: this project's earlier design built a backend primarily to have somewhere to host curated banlists, then routed card enrichment through it too since the backend already existed. Building the backend first was reprioritized: ship a working extension against direct API calls now, and revisit a hosted backend later once the bundled-banlist trade-off below is felt in practice.

**Alternative considered (deferred, not rejected)**: a project-hosted backend (API + database) that ingests Scryfall's bulk data and serves both banlists from one place. Still the better long-term shape — it decouples banlist updates from extension releases and lets enrichment be cached once server-side instead of once per user — but is out of scope for this iteration. Tracked under Open Questions.

### Commander 500 Duel banlist: bundled static dataset, not a live source
Since Duel Commander has no API and isn't a Scryfall-recognized format, its banlist ships as a versioned JSON dataset inside the extension, curated by the maintainer from duelcommander.org/banlist at release time, with an "as of" date shown to the user.

**Why**: this is the only option that avoids a backend while still supporting Commander 500 Duel legality checking, which the proposal treats as core (not optional) functionality. It has a real cost — Duel Commander's ~bimonthly banlist review means the bundled data can lag a real-world change until the next extension release — accepted deliberately for this iteration. A human curating the dataset (rather than an unattended scraper feeding it) is still cheap insurance against a parsing false-positive (e.g. misreading a "recently unbanned" section as "banned") turning into a wrong legality verdict for every user until the next release.

### Budget/legality computed client-side from cached data
Once a deck's cards are enriched (from Scryfall, cached locally) and the bundled Commander 500 Duel dataset is loaded, `budget-tracking` and `format-legality` compute entirely in the extension against local state — no per-edit network round trip. Only the initial Scryfall lookup per unseen card is a network call.

**Why**: the proposal requires live updates as the user edits the deck; round-tripping every drag-and-drop move to a network call would add latency and a failure mode for no benefit, since the underlying data (price from the page, attributes from cache, Duel Commander banlist from the bundle) is already local once fetched once.

## Risks / Trade-offs

- **[Risk] LigaMagic changes its page markup, breaking capture.** → Mitigation: isolated adapter module (see Decisions) with fixture tests; surfaced to the user as an explicit "could not read this page" state (per `deck-page-capture` spec) rather than silent bad data.
- **[Risk] Commander 500 Duel banlist updates require a new extension release**, since the dataset is bundled rather than served live. A real-world ban could lag behind for however long it takes to curate, release, and have users update. → Mitigation: the bundled dataset's "as of" date is always visible (per `card-data-service` spec) so a stale result is visible, not silent; revisit a hosted backend (Open Questions) if this lag proves painful in practice.
- **[Risk] Direct client-side Scryfall calls from every user's browser risk hitting Scryfall's fair-use rate limits at scale**, and each user pays the latency of an uncached lookup. → Mitigation: `card-data-service` spec requires local caching with a freshness window (see Decisions); if usage grows enough for this to matter, that's a strong signal to build the deferred backend, which would let card data be cached once server-side.
- **[Risk] Card name matching between LigaMagic's displayed name and Scryfall's canonical name may mismatch** (accents, DFC card naming, Portuguese vs English names on LigaMagic). → Mitigation: enrichment lookup normalizes accents/casing and falls back through Scryfall's fuzzy/autocomplete matching before returning not-found; treated as an implementation detail of `card-data-service`, not restated in the spec's observable contract beyond the not-found scenario already defined there.
- **[Risk] Scryfall's own price data is stale (>24h) and must not leak into budget totals.** → Mitigation: design deliberately keeps Scryfall as attributes-and-legality-only; `budget-tracking` spec sources price only from `deck-page-capture`, never from `card-data-service`.
- **[Trade-off] No live write-back to LigaMagic's save flow** means the user's authoritative "saved" deck still lives on LigaMagic and must be updated via the export/paste flow, an extra manual step. Accepted for this change per proposal's explicit deferral; revisit once LigaMagic's save request shape is understood well enough to attempt it safely.

## Migration Plan

This is a new product with no prior deployment. Rollout is a single artifact: ship the extension, with its bundled Commander 500 Duel dataset, pointed at Scryfall's public API. There is no backend to stand up or load-test in this iteration. No rollback concerns beyond normal versioned extension releases, since there is no existing user data to migrate.

## Open Questions

- Whether LigaMagic's save flow can later be driven from the extension (the deferred write-back stretch goal) is genuinely open and doesn't affect this change's specs, approach, or tasks — it's explicitly out of scope here and can be investigated in a follow-up change once this ships.
- Whether/when to build the deferred project-hosted backend and database (to decouple Commander 500 Duel banlist updates from extension releases and cache Scryfall lookups server-side) is left to future exploration per the user's direction; nothing in this change's specs or tasks depends on that decision being made now.
