## Why

The extension is functionally ready for a first public release, but its identity is unfinished for that purpose: the project name (`Montador de Decks Commander 500` / `commander-500-deckbuilder`) predates the "CMD500 Deck Builder" brand mark already adopted in the UI header (see the archived `deckbuilder-branding` change), there is no `LICENSE` file anywhere in the repo (so the public GitHub copy is legally "all rights reserved" by default, blocking the redistribution rights a store listing implies), and the README is written as an internal engineering doc rather than the end-user-facing text needed for a Chrome Web Store description. None of this blocks the extension from working; all of it blocks submitting it to a store.

## What Changes

- Rename the project consistently to **CMD500 Deck Builder - LigaMagic Deck Enhancer** across `extension/public/manifest.json` (`name`, `description`, `action.default_title`), `extension/package.json` (`name`), and both README H1s. UI copy and README body stay Portuguese; the manifest/store title stays the English brand name (matches the existing PT-BR-only UI decision — see "Português brasileiro fixo na interface" in the current README).
- Add a `LICENSE` file with the full GPL-3.0 text, and add a "Licença" section to the root README linking it.
- Rewrite `README.md` for an end-user-first audience: what the extension is, how it works (requires a deck already built in LigaMagic), a use-case how-to section (4 walkthroughs: budget-while-editing, pre-event legality check, mana-curve gap-finding, reorganize-then-export), followed by a clearly separated technical section (architecture summary, build/test setup, contributing, license). The existing "Estrutura do repositório" and "Testes e verificação" sections are preserved as-is under the technical section. The "Decisões técnicas" section is removed (its rationale already lives in each change's own `design.md` under `openspec/changes/`, so the README copy was a redundant executive summary — see `design.md` — Decisions). The "Build e desenvolvimento" subsection is dropped rather than duplicated, since `extension/README.md`'s existing "Configuração" section already covers the same setup steps in more detail. The "Mantendo este documento atualizado" closing note is dropped, since its entire content was instructions for maintaining the now-removed "Decisões técnicas" section.
- Produce a Chrome Web Store–ready listing text (summary ≤132 chars, detailed description) derived from the new README's end-user sections, plus an explicit non-affiliation/privacy disclaimer paragraph required by store policy — delivered as a new `store-listing.md` reference doc (not user-facing UI, not shipped in the extension bundle) since it has different length constraints than the README and needs to be pasted into the Chrome/Firefox/Edge dashboards by hand.
- Document the store submission process (Chrome Web Store, Firefox AMO, Edge Add-ons) as a checklist in `tasks.md`: developer account setup, build/zip steps, required assets (screenshots, privacy policy URL), permission justifications, and the Firefox-specific source-code-upload and manifest-compatibility considerations.

**BREAKING**: none — this is a rename and documentation/licensing change. No user-facing behavior, storage schema, or API changes.

## Capabilities

No spec-level behavior changes — this change touches naming, documentation, licensing, and release packaging only. `skip_specs: true` is set in `.openspec.yaml` accordingly.

### New Capabilities
(none)

### Modified Capabilities
(none)

## Impact

- **Code**: `extension/public/manifest.json`, `extension/package.json` — identifier/string changes only, no logic changes.
- **Docs**: `README.md` (rewritten), `extension/README.md` (title only), new `LICENSE`, new `openspec/changes/rebrand-and-launch-prep/store-listing.md` (reference doc, not shipped).
- **No changes** to `extension/src/**`, tests, or build tooling.
- **Downstream**: this is a prerequisite for the actual Chrome/Firefox/Edge store submissions, which remain manual, out-of-repo actions the user performs using the checklist this change produces.
