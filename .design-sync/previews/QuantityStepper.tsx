import { QuantityStepper } from "cmd500-design-system";
import { forest } from "./_fixtures";

export function Default() {
  return <QuantityStepper card={forest} name={forest.pageNamePt ?? forest.name} onQuantityChange={() => {}} onRemove={() => {}} />;
}

export function SingleCopy() {
  const single = { ...forest, quantity: 1 };
  return <QuantityStepper card={single} name={single.pageNamePt ?? single.name} onQuantityChange={() => {}} onRemove={() => {}} />;
}

export function ReadOnly() {
  return <QuantityStepper card={forest} name={forest.pageNamePt ?? forest.name} />;
}
