import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalitySummary } from "./LegalitySummary";
import { commander500DuelBanlistAsOf } from "../../lib/banlist/commander-500-duel";

describe("LegalitySummary as-of date (verification finding #2)", () => {
  it("shows the bundled Commander 500 Duel dataset's as-of date when that format is active", () => {
    render(
      <LegalitySummary
        legality={{ status: "ok", illegalCardIds: new Set() }}
        format="commander500Duel"
      />,
    );
    expect(
      screen.getByText(`Lista de banidos do Duel atualizada em ${commander500DuelBanlistAsOf}`),
    ).toBeTruthy();
  });

  it("shows the as-of date alongside an illegal-card count too", () => {
    render(
      <LegalitySummary
        legality={{ status: "ok", illegalCardIds: new Set(["a"]) }}
        format="commander500Duel"
      />,
    );
    expect(
      screen.getByText(`Lista de banidos do Duel atualizada em ${commander500DuelBanlistAsOf}`),
    ).toBeTruthy();
    expect(screen.getByText("1 carta ilegal")).toBeTruthy();
  });

  it("does not show the Duel banlist date for Commander 500 (Scryfall-backed, no bundled dataset)", () => {
    render(
      <LegalitySummary
        legality={{ status: "ok", illegalCardIds: new Set() }}
        format="commander500"
      />,
    );
    expect(screen.queryByText(new RegExp(commander500DuelBanlistAsOf))).toBeNull();
  });
});
