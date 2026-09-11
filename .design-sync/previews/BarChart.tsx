import { BarChart, manaCurveBuckets, colorBuckets, typeBuckets } from "cmd500-design-system";
import { mainDeck } from "./_fixtures";

export function ManaCurve() {
  return <BarChart title="Curva" buckets={manaCurveBuckets(mainDeck)} />;
}

/** The one chart whose bars carry real mana-identity color. */
export function ColorDistribution() {
  return <BarChart title="Cor" buckets={colorBuckets(mainDeck)} />;
}

export function TypeDistribution() {
  return <BarChart title="Tipo" buckets={typeBuckets(mainDeck)} />;
}

export function Empty() {
  return <BarChart title="Curva" buckets={[]} />;
}
