## 1. Rename

- [x] 1.1 Update `extension/public/manifest.json`: `name` → `CMD500 Deck Builder - LigaMagic Deck Enhancer`, rewrite `description` as a short PT-BR one-liner, update `action.default_title`. Verify `npm run build` still succeeds and `dist/manifest.json` reflects the new values.
- [x] 1.2 Update `extension/package.json` `name` → `cmd500-deck-builder`. Verify `npm install` and `npm run build` still succeed with no broken references.
- [x] 1.3 Update the H1 in `README.md` and `extension/README.md` to the new name. Verify by grepping the repo for the old strings (`Montador de Decks Commander 500`, `commander-500-deckbuilder`) and confirming no remaining references outside `openspec/changes/archive/`.

## 2. License

- [x] 2.1 Add a `LICENSE` file at the repo root with the full, unmodified GPL-3.0 text (standard FSF wording, project name/year filled into the preamble where the template calls for it).
- [x] 2.2 Add a short "Licença" section to `README.md` linking `LICENSE`, placed under the technical section per design.md.

## 3. README rewrite

- [x] 3.1 Rewrite `README.md` top section (through the feature bullet list) for an end-user audience: what it is, how it works, requires a deck already built in LigaMagic, non-affiliation disclaimer. Verify by reading it as someone who has never seen the codebase — it should be understandable without opening any source file.
- [x] 3.2 Add a "Como usar — casos de uso" section with the four how-to walkthroughs (budget-while-editing, pre-event legality check, mana-curve gap-finding, reorganize-then-export).
- [x] 3.3 Reorganize the remaining content under a clearly headed "Seção técnica": architecture summary, contributing, license — preserving the existing "Estrutura do repositório" and "Testes e verificação" sections verbatim. Remove "Decisões técnicas" (rationale already lives in each change's `design.md` under `openspec/changes/`) and the redundant "Build e desenvolvimento" subsection (already covered by `extension/README.md`'s "Configuração" section); drop the "Mantendo este documento atualizado" closing note and fix "Contribuindo"'s reference, both of which only existed to describe the removed section. Verify by diffing against the pre-change README that "Estrutura do repositório" and "Testes e verificação" appear unchanged, and by grepping the file for "Decisões técnicas" to confirm no dangling reference remains.
- [x] 3.4 Add a short "Contribuindo" paragraph (issue/PR expectations, pointer to `openspec/` for non-trivial changes).

## 4. Store listing text

- [x] 4.1 Write `openspec/changes/rebrand-and-launch-prep/store-listing.md` containing: the Chrome Web Store summary (verify it is ≤132 characters by counting it), the detailed description (derived from README's end-user section plus the four use-case how-tos), and the required non-affiliation/no-data-collection disclaimer paragraph.
- [x] 4.2 Draft a minimal privacy-policy statement ("no data is collected, stored, or transmitted; all processing is local to the browser") suitable for hosting at a public URL, and note in `store-listing.md` where it will be hosted (e.g. GitHub Pages or a rendered `PRIVACY.md`).

## 5. Store submission checklist (manual, tracked here for completeness)

- [ ] 5.1 Chrome Web Store: create/verify Developer Dashboard account, pay the one-time $5 registration fee.
- [ ] 5.2 Chrome Web Store: capture 1–5 screenshots (1280×800 or 640×400) showing budget bar, legality warning, drag-and-drop, mana curve chart, export dialog.
- [ ] 5.3 Chrome Web Store: `npm run build`, zip the contents of `dist/`, create the store listing (name, summary, description, category, PT-BR primary language, screenshots), fill the Privacy practices tab with the permission justifications from design.md, submit for review (start as Unlisted).
- [ ] 5.4 Firefox AMO spike: determine whether the current manifest needs `browser_specific_settings.gecko.id` and whether `background.service_worker` needs a `background.scripts` fallback for Firefox's MV3 support — resolve before attempting submission, not assumed.
- [ ] 5.5 Firefox AMO: create developer account, submit the built package plus source code + build instructions (required since the shipped code is bundled), choose Listed vs. self-distributed signed `.xpi`.
- [ ] 5.6 Edge Add-ons: create Microsoft Partner Center account (free), reuse the Chrome `dist/` zip, submit with the same listing assets and privacy policy URL.
