import type { ReactNode } from "react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CardVisualTile, type DeckCard } from "cmd500-design-system";
import { solRing, timeWalk, forest, counterspell, eternalWitness, commander } from "./_fixtures";

function Tiles({ cards, children }: { cards: DeckCard[]; children: ReactNode }) {
  return (
    <DndContext>
      <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="c500-tile-grid">{children}</div>
      </SortableContext>
    </DndContext>
  );
}

export function Grid() {
  const cards = [solRing, counterspell, eternalWitness, timeWalk];
  return (
    <Tiles cards={cards}>
      {cards.map((card) => (
        <CardVisualTile
          key={card.id}
          card={card}
          nameLanguage="pt"
          illegal={card.id === timeWalk.id}
          onQuantityChange={() => {}}
          onRemove={() => {}}
          onPriceChange={() => {}}
        />
      ))}
    </Tiles>
  );
}

/** The Commander hero block: a much larger tile with its name captioned below the art. */
export function Hero() {
  return (
    <Tiles cards={[commander]}>
      <CardVisualTile card={commander} nameLanguage="pt" size="hero" onQuantityChange={() => {}} onRemove={() => {}} onPriceChange={() => {}} />
    </Tiles>
  );
}

export function BasicLand() {
  return (
    <Tiles cards={[forest]}>
      <CardVisualTile card={forest} nameLanguage="pt" onQuantityChange={() => {}} onRemove={() => {}} />
    </Tiles>
  );
}
