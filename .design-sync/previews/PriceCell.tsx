import { PriceCell } from "cmd500-design-system";
import { solRing, mysticConfluence, timeWalk } from "./_fixtures";

export function Default() {
  return <PriceCell card={solRing} name={solRing.name} className="c500-card__price" />;
}

export function Editable() {
  return (
    <PriceCell
      card={solRing}
      name={solRing.name}
      className="c500-card__price"
      onPriceChange={() => {}}
    />
  );
}

export function UnknownPrice() {
  return (
    <PriceCell
      card={mysticConfluence}
      name={mysticConfluence.name}
      className="c500-card__price"
      onPriceChange={() => {}}
    />
  );
}

export function OverBudget() {
  return (
    <PriceCell
      card={timeWalk}
      name={timeWalk.name}
      className="c500-card__price"
      overBudget
      title="Conta para o deck estar acima do limite de R$500"
      onPriceChange={() => {}}
    />
  );
}

export function TileVariant() {
  return (
    <PriceCell card={solRing} name={solRing.name} className="c500-tile__price" as="div" onPriceChange={() => {}} />
  );
}
