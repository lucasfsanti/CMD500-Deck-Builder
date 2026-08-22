import type { LegalityResult } from "../../lib/legality/check-legality";
import { commander500DuelBanlistAsOf } from "../../lib/banlist/commander-500-duel";
import type { Format } from "../../lib/deck/types";

export interface LegalitySummaryProps {
  legality: LegalityResult;
  format: Format;
}

/**
 * Commander 500 Duel legality comes from the bundled dataset, whose
 * currency the user can't otherwise see — card-data-service requires
 * showing its "as of" date alongside the legality results.
 */
function DuelBanlistAsOf() {
  return <span className="c500-legality__as-of">Duel banlist as of {commander500DuelBanlistAsOf}</span>;
}

export function LegalitySummary({ legality, format }: LegalitySummaryProps) {
  const showAsOf = format === "commander500Duel";

  if (legality.status === "unknown") {
    return (
      <div className="c500-legality c500-legality--unknown">
        <span className="c500-legality__dot" aria-hidden="true" />
        Unable to verify legality — Scryfall is unreachable
      </div>
    );
  }

  const count = legality.illegalCardIds.size;
  if (count === 0) {
    return (
      <div className="c500-legality">
        <span className="c500-legality__dot" aria-hidden="true" />
        No illegal cards
        {showAsOf && <DuelBanlistAsOf />}
      </div>
    );
  }

  return (
    <div className="c500-legality c500-legality--illegal">
      <span className="c500-legality__dot" aria-hidden="true" />
      {count} illegal card{count === 1 ? "" : "s"}
      {showAsOf && <DuelBanlistAsOf />}
    </div>
  );
}
