## 1. Resize the hover preview

- [x] 1.1 In `extension/src/ui/panel.css`, change `.c500-hover-preview`'s `width`/`height` from `210px`/`294px` to `312px`/`445px`. Verify by inspecting the rule directly (`grep -n -A5 "c500-hover-preview" extension/src/ui/panel.css`) and, if feasible, a quick live check that the popup box now renders at 312×445 while hovering a List-view row.
