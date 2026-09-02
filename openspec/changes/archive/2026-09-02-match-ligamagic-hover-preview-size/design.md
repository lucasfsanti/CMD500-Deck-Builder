## Context

See proposal.md for motivation. `.c500-hover-preview` (`panel.css:399-411`) is a fixed-size floating `<div>` positioned via inline `left`/`top` from the pointer, currently `width: 210px; height: 294px`.

## Goals / Non-Goals

**Goals:**
- Make the hover preview large enough to read comfortably, by matching a size that's already proven legible: LigaMagic's own tooltip.

**Non-Goals:**
- No change to positioning/offset logic (`translate(16px, -50%)`), viewport-edge clamping, or which artwork source is used — only the box's fixed dimensions change.

## Decisions

**Target size is exactly 312×445px, matching LigaMagic's own tooltip.** Verified live against the source site: every card's sticky-tooltip `<img>` on a real deck page (85/85 sampled) renders at a fixed `width="312" height="445"`, regardless of the underlying image's native resolution (which was 265×370 for the sampled card — LigaMagic itself already upscales ~1.18× to reach 312×445). Since `resolveCardArt` prefers this exact same scraped image (`card.pageImageUrl`) before falling back to Scryfall, using LigaMagic's own presentation size means no additional blur beyond what a LigaMagic user already sees on the source page. Alternatives considered: an arbitrary larger fixed size (e.g. 300×420, matching the 5:7 ratio used elsewhere in this app) — rejected in favor of matching a real, precedented reference point rather than picking a number that doesn't correspond to anything.

## Risks / Trade-offs

- A larger box is more likely to clip against the viewport edge for cards near the right or bottom of the screen, since positioning/clamping logic is unchanged (see proposal's Non-Goals). This is a known, accepted trade-off — not addressed by this change.
