import { LegalitySummary } from "cmd500-design-system";
import { illegalCardIds } from "./_fixtures";

export function AllLegal() {
  return <LegalitySummary legality={{ status: "ok", illegalCardIds: new Set() }} format="commander500" />;
}

export function OneIllegalCard() {
  return <LegalitySummary legality={{ status: "ok", illegalCardIds }} format="commander500" />;
}

export function ManyIllegalCards() {
  return (
    <LegalitySummary
      legality={{ status: "ok", illegalCardIds: new Set(["a", "b", "c"]) }}
      format="commander500"
    />
  );
}

/** Scryfall unreachable — legality can't be confirmed yet (Commander 500 only). */
export function Unknown() {
  return <LegalitySummary legality={{ status: "unknown", illegalCardIds: new Set() }} format="commander500" />;
}

/** Commander 500 Duel reads the bundled offline banlist and always shows its "as of" date. */
export function DuelFormat() {
  return <LegalitySummary legality={{ status: "ok", illegalCardIds: new Set() }} format="commander500Duel" />;
}
