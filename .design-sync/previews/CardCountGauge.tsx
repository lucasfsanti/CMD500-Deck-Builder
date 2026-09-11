import { CardCountGauge, calculateCardCount } from "cmd500-design-system";
import { mainDeck } from "./_fixtures";

export function UnderCap() {
  return <CardCountGauge cardCount={calculateCardCount(mainDeck)} />;
}

export function OverCap() {
  const padded = [...mainDeck, ...mainDeck.map((c) => ({ ...c, id: `${c.id}-2`, quantity: c.quantity * 12 }))];
  return <CardCountGauge cardCount={calculateCardCount(padded)} />;
}
