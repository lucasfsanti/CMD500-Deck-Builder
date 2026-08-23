import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarChart } from "./BarChart";
import { manaCurveBuckets, colorBuckets, typeBuckets } from "../../../lib/analytics/bucket-counts";
import type { DeckCard } from "../../../lib/deck/types";

function card(
  name: string,
  overrides: Partial<DeckCard> & { typeLine?: string; colorIdentity?: string[]; cmc?: number } = {},
): DeckCard {
  const { typeLine = "Creature", colorIdentity = [], cmc = 1, ...rest } = overrides;
  return {
    id: name,
    name,
    quantity: 1,
    zone: "mainDeck",
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    enrichment: {
      name,
      typeLine,
      colorIdentity,
      cmc,
      layout: "normal",
      legalInCommander: true,
      scryfallId: name,
      imageUrl: undefined,
    },
    enrichmentStatus: "ok",
    ...rest,
  };
}

const fixtureDeck: DeckCard[] = [
  card("Elf", { typeLine: "Creature", colorIdentity: ["G"], cmc: 1, quantity: 4 }),
  card("Bolt", { typeLine: "Instant", colorIdentity: ["R"], cmc: 1 }),
  card("Dragon", { typeLine: "Creature", colorIdentity: ["R", "G"], cmc: 5 }),
  card("Rock", { typeLine: "Artifact", colorIdentity: [], cmc: 2 }),
];

describe("BarChart (task 5.2)", () => {
  it("renders the mana curve chart against a fixture deck", () => {
    render(<BarChart title="Mana Curve" buckets={manaCurveBuckets(fixtureDeck)} />);
    expect(screen.getByText("Mana Curve")).toBeTruthy();
    // CMC labels present: 1 (Elf x4 + Bolt), 2 (Rock), 5 (Dragon).
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("renders the color-distribution chart against a fixture deck", () => {
    render(<BarChart title="Color" buckets={colorBuckets(fixtureDeck)} />);
    expect(screen.getByText("Colorless")).toBeTruthy();
    expect(screen.getByText("Red")).toBeTruthy();
    expect(screen.getByText("Green")).toBeTruthy();
    expect(screen.getByText("Multicolor")).toBeTruthy();
  });

  it("renders the type-distribution chart against a fixture deck", () => {
    render(<BarChart title="Type" buckets={typeBuckets(fixtureDeck)} />);
    expect(screen.getByText("Creature")).toBeTruthy();
    expect(screen.getByText("Instant")).toBeTruthy();
    expect(screen.getByText("Artifact")).toBeTruthy();
  });

  it("shows an empty state when there are no Main Deck cards yet", () => {
    render(<BarChart title="Mana Curve" buckets={[]} />);
    expect(screen.getByText("No Main Deck cards yet")).toBeTruthy();
  });

  it("scales each bar's width relative to the largest bucket", () => {
    const { container } = render(
      <BarChart title="Mana Curve" buckets={manaCurveBuckets(fixtureDeck)} />,
    );
    const bars = container.querySelectorAll(".c500-chart__bar");
    // CMC 1 has count 5 (4 Elf + 1 Bolt), the largest bucket, so its bar is full width.
    expect((bars[0] as HTMLElement).style.width).toBe("100%");
  });
});
