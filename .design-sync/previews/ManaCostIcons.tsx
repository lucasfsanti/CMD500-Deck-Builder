import { ManaCostIcons } from "cmd500-design-system";

export function MulticolorCost() {
  return <ManaCostIcons symbols={["3", "B", "G", "U"]} />;
}

export function CheapColoredCost() {
  return <ManaCostIcons symbols={["U", "U"]} />;
}

export function ColorlessCost() {
  return <ManaCostIcons symbols={["1"]} />;
}

/** A double-faced card's two costs, separated by the "//" divider. */
export function DoubleFacedCost() {
  return <ManaCostIcons symbolGroups={[["2", "G"], ["4", "G"]]} />;
}

/** No captured mana cost (e.g. a basic land) — renders nothing. */
export function NoCost() {
  return (
    <div style={{ color: "var(--c500-text-soft)", fontSize: 12 }}>
      (renders nothing — <ManaCostIcons symbols={undefined} />)
    </div>
  );
}
