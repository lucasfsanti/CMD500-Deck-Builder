## Why

The List-view hover preview (`.c500-hover-preview`) renders artwork at 210×294px — the same size as a Visual-view tile — which is too small to read comfortably. LigaMagic's own hover tooltip, scraped as the primary artwork source for this exact preview, renders every card at a fixed 312×445px; matching that size is a direct, well-precedented fix with no new blur risk, since the primary artwork source already displays at that size on the source site.

## What Changes

- `.c500-hover-preview`'s fixed width/height changes from 210×294px to 312×445px, matching LigaMagic's own tooltip presentation size exactly.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `card-visual-view`: modifies "List view artwork hover preview" to specify the preview's size matches LigaMagic's own tooltip presentation size (312×445px) rather than Visual view's small-tile size.

## Impact

- `extension/src/ui/panel.css`: `.c500-hover-preview`'s `width`/`height` change from 210px/294px to 312px/445px.
