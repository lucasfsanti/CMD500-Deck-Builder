import type { ReactNode } from "react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CardRow, type DeckCard } from "cmd500-design-system";
import { solRing, timeWalk, forest, counterspell, invasionOfIkoria, mysticConfluence } from "./_fixtures";

// CardRow reads useSortable, which needs a DndContext ancestor to compute a
// real (inert, since nothing is being dragged) transform — the same
// SortableContext every row gets in ZoneSection.
function Rows({ cards, children }: { cards: DeckCard[]; children: ReactNode }) {
  return (
    <DndContext>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", width: 360 }}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

export function Default() {
  return (
    <Rows cards={[solRing]}>
      <CardRow card={solRing} nameLanguage="pt" onQuantityChange={() => {}} onRemove={() => {}} onPriceChange={() => {}} />
    </Rows>
  );
}

/** Multiple rows, showing every mana-identity rail color side by side. */
export function ZoneList() {
  const cards = [solRing, counterspell, invasionOfIkoria, timeWalk];
  return (
    <Rows cards={cards}>
      {cards.map((card) => (
        <CardRow
          key={card.id}
          card={card}
          nameLanguage="pt"
          illegal={card.id === timeWalk.id}
          onQuantityChange={() => {}}
          onRemove={() => {}}
          onPriceChange={() => {}}
        />
      ))}
    </Rows>
  );
}

export function IllegalCard() {
  return (
    <Rows cards={[timeWalk]}>
      <CardRow card={timeWalk} nameLanguage="pt" illegal onQuantityChange={() => {}} onRemove={() => {}} onPriceChange={() => {}} />
    </Rows>
  );
}

export function OverBudget() {
  return (
    <Rows cards={[timeWalk]}>
      <CardRow card={timeWalk} nameLanguage="pt" overBudget onQuantityChange={() => {}} onRemove={() => {}} onPriceChange={() => {}} />
    </Rows>
  );
}

/** A basic land shows the quantity stepper instead of a price. */
export function BasicLand() {
  return (
    <Rows cards={[forest]}>
      <CardRow card={forest} nameLanguage="pt" onQuantityChange={() => {}} onRemove={() => {}} />
    </Rows>
  );
}

export function UnresolvedPrice() {
  return (
    <Rows cards={[mysticConfluence]}>
      <CardRow card={mysticConfluence} nameLanguage="pt" onQuantityChange={() => {}} onRemove={() => {}} onPriceChange={() => {}} />
    </Rows>
  );
}
