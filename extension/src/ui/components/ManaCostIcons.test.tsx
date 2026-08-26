import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ManaCostIcons } from "./ManaCostIcons";

describe("ManaCostIcons", () => {
  it("renders one icon per symbol, in order, hotlinked to LigaMagic's own asset host", () => {
    const { container } = render(<ManaCostIcons symbols={["2", "G", "U", "R"]} />);
    const imgs = container.querySelectorAll("img.c500-mana-cost__icon");
    expect(imgs).toHaveLength(4);
    expect([...imgs].map((img) => img.getAttribute("src"))).toEqual([
      "https://www.ligamagic.com.br/arquivos/img/mtg/symb/2.svg",
      "https://www.ligamagic.com.br/arquivos/img/mtg/symb/G.svg",
      "https://www.ligamagic.com.br/arquivos/img/mtg/symb/U.svg",
      "https://www.ligamagic.com.br/arquivos/img/mtg/symb/R.svg",
    ]);
  });

  it("renders nothing when there are no captured symbols", () => {
    const { container } = render(<ManaCostIcons symbols={undefined} />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelector(".c500-mana-cost")).toBeNull();
  });

  it("renders nothing for an empty symbol list", () => {
    const { container } = render(<ManaCostIcons symbols={[]} />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });
});
