import { DndContext } from "@dnd-kit/core";
import { ZoneSection } from "cmd500-design-system";
import { mainDeck, commander, illegalCardIds } from "./_fixtures";

export function MainDeckList() {
  return (
    <DndContext>
      <ZoneSection zone="mainDeck" cards={mainDeck} nameLanguage="pt" illegalCardIds={illegalCardIds} />
    </DndContext>
  );
}

export function MainDeckVisual() {
  return (
    <DndContext>
      <ZoneSection zone="mainDeck" cards={mainDeck} nameLanguage="pt" viewMode="visual" illegalCardIds={illegalCardIds} />
    </DndContext>
  );
}

/** The Commander hero block: forces large Visual-mode tiles, no group label. */
export function CommanderHero() {
  return (
    <DndContext>
      <ZoneSection zone="comandante" cards={[commander]} nameLanguage="pt" hero />
    </DndContext>
  );
}

export function Collapsed() {
  return (
    <DndContext>
      <ZoneSection zone="mainDeck" cards={mainDeck} nameLanguage="pt" collapsed onToggleCollapse={() => {}} />
    </DndContext>
  );
}

/** Main Deck / Maybeboard get an independent per-zone name filter. */
export function WithFilter() {
  return (
    <DndContext>
      <ZoneSection zone="mainDeck" cards={mainDeck} nameLanguage="pt" filterable />
    </DndContext>
  );
}

export function GroupedByColor() {
  return (
    <DndContext>
      <ZoneSection zone="mainDeck" cards={mainDeck} nameLanguage="pt" groupingAxis="color" />
    </DndContext>
  );
}
