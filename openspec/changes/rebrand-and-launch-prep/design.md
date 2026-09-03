## Context

See proposal.md - Why for the motivation. Relevant current-state facts:

- The UI brand mark ("CMD500 Deckbuilder" wordmark, gold badge) already exists in the header per the archived `deckbuilder-branding` change; only the textual name (manifest, package.json, README titles) hasn't caught up.
- The UI and README body are Portuguese-only by deliberate prior decision ("Português brasileiro fixo na interface" in the current README) — the entire user base captures decks from a Portuguese-language site.
- No `LICENSE` file exists in the repo today; the user has chosen **GPL-3.0**.
- `extension/README.md` is the canonical build/dev doc (install, load-unpacked, tests, Playwright verification scripts, banlist update procedure) and is out of scope here beyond its title — the proposal only renames its H1.
- Chrome Web Store, Firefox AMO, and Edge Add-ons each require store-listing text with different length limits than a README (summary ≤132 chars, detailed description separately), plus a reachable privacy-policy URL and written justification for each requested permission (`storage`, `host_permissions` for `ligamagic.com.br` and `api.scryfall.com`).

## Goals / Non-Goals

**Goals:**
- One consistent name (`CMD500 Deck Builder - LigaMagic Deck Enhancer`) everywhere it's user-visible or store-visible.
- A README that reads as an end-user pitch first, technical reference second — without duplicating content that already lives elsewhere (each change's own `design.md` under `openspec/changes/`, and `extension/README.md`'s existing build/test docs).
- A GPL-3.0 `LICENSE` file and a short README section pointing to it.
- A separate, store-dashboard-ready listing text, since it has different constraints (character limits, no markdown, needs a non-affiliation/privacy paragraph) than the README and isn't part of the shipped extension bundle.
- A submission checklist (`tasks.md`) covering all three target stores, including the two Firefox-specific technical unknowns identified below.

**Non-Goals:**
- No actual store submission (account creation, payment, upload) — that's a manual, out-of-repo action for the user, not something this change can perform.
- No screenshot capture/asset production — flagged as a task, not produced here (no way to script "take a good product screenshot" as an implementation step).
- No change to `extension/src/**`, manifest permissions, or any runtime behavior.
- No Firefox manifest compatibility fix (e.g. adding `browser_specific_settings.gecko.id`, resolving the `background.service_worker` vs `background.scripts` question) — that's real engineering work gated on whether the user actually pursues the Firefox store, called out as a task with a spike, not pre-solved here.

## Decisions

**Manifest/store title stays English; UI and README body stay Portuguese.** The user's requested name (`CMD500 Deck Builder - LigaMagic Deck Enhancer`) is in English and reads as the deliberate public brand name, while every other user-facing string in the extension is Portuguese by prior, unreversed decision. Splitting them isn't inconsistent — the manifest `name` is what Chrome/Firefox/Edge show in *their* UI (store listing, toolbar tooltip, extensions page), which is reasonably bilingual/English-leaning audience, whereas the in-app UI only ever runs against a Portuguese-language site for a Portuguese-language user base. Alternative considered: translate the brand name to Portuguese too — rejected because the user supplied the English name verbatim as *the* name to rename to, not as a description to translate.

**The store listing text is a separate file (`store-listing.md`) inside the change folder, not a section of `README.md`.** A Chrome Web Store summary field has a hard ~132-character limit and no markdown; pasting a README section into it verbatim would silently truncate or carry broken formatting. Keeping it separate also makes clear it's not shipped in the extension bundle and not meant to be read on GitHub — it is a reference doc for pasting into three different dashboards. Alternative considered: derive it live from the README each time — rejected as unnecessary process for a one-time (plus rare update) copy-paste artifact.

**[Decision, superseded]** ~~The existing "Decisões técnicas" section is preserved verbatim under the new "Seção técnica" umbrella, not rewritten or condensed.~~ First implementation did this — the full section was kept, just re-nested under headings one level deeper. Live review decided to drop it from the README entirely instead. Superseded by the removal decision below.

**"Decisões técnicas" is removed from the README, not preserved.** The section's own stated contract was "resumo executivo, não o substituto" — the full rationale, alternatives, and accepted risks for every entry already live in the corresponding change's `design.md` (in `openspec/changes/` or its `archive/`, this file being one of them). An end-user-first README doesn't need an inline engineering decision log duplicating a source of truth that already exists and is more complete; anyone who wants that detail reads the actual `design.md` files. Removing it also retires two dependent references: "Contribuindo" now points at `openspec/changes/` directly instead of at the removed section, and the "Mantendo este documento atualizado" closing note is dropped outright, since its entire content was instructions for maintaining the section that no longer exists.

**"Build e desenvolvimento" is dropped from `README.md` rather than relocated as new content, because `extension/README.md`'s existing "Configuração" section already covers the identical ground** (`npm install && npm run build`, plus a fuller explanation of what `dist/` contains than the root README's version had). The root README's "Instalação" section already links to `extension/README.md` for the full setup walkthrough, so there was nothing to actually move — the redundant copy is simply removed, and the single copy that remains is the one that was already more complete.

**GPL-3.0 full license text is vendored as a static `LICENSE` file**, not generated or templated. Standard practice — GitHub, npm, and both Chrome/Firefox review teams expect the canonical FSF text at the repo root under that exact filename.

## Risks / Trade-offs

- **[Risk]** Firefox's Manifest V3 support has real gaps versus Chrome's (background service worker semantics, required `browser_specific_settings.gecko.id`) that aren't resolved by this change. → **Mitigation:** `tasks.md` calls this out as an explicit spike task before attempting an AMO submission, so it isn't silently assumed to work from the Chrome build.
- **[Risk]** A privacy-policy URL is a required dashboard field on both Chrome and Firefox, and this change doesn't provision hosting for one. → **Mitigation:** `tasks.md` includes hosting a minimal privacy statement (e.g. GitHub Pages, or linking the rendered `PRIVACY.md` on GitHub) as a concrete task, not left implicit.
- **[Risk]** Renaming `extension/package.json`'s `name` field is cosmetic (the package is `"private": true`, never published to npm) but could confuse anyone with a local checkout referencing the old name in scripts/CI. → **Mitigation:** grep the repo for the old identifiers (`commander-500-deckbuilder`) as a task step before considering the rename done, so no stale reference is left behind.

## Migration Plan

Documentation, licensing, and manifest string changes only — no data, no runtime migration. "Deploy" is committing the changes and, separately and manually, submitting the built extension to each store's dashboard (tracked in tasks.md, outside this repo's control). Rollback is a plain revert; nothing is destructive.
