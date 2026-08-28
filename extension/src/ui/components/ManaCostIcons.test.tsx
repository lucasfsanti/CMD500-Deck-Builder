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

  it("renders each face's icons separated by a // divider, given symbolGroups", () => {
    const { container } = render(
      <ManaCostIcons symbolGroups={[["2", "G", "U"], ["1", "G", "U"]]} />,
    );
    const mana = container.querySelector(".c500-mana-cost")!;
    const iconsAndDividers = [...mana.children].map((el) =>
      el.classList.contains("c500-mana-cost__divider") ? "//" : el.getAttribute("alt"),
    );
    expect(iconsAndDividers).toEqual(["2", "G", "U", "//", "1", "G", "U"]);
    expect(container.querySelectorAll(".c500-mana-cost__divider")).toHaveLength(1);
  });

  it("shows no divider before the first group or after the last", () => {
    const { container } = render(<ManaCostIcons symbolGroups={[["W"], ["U"], ["B"]]} />);
    expect(container.querySelectorAll(".c500-mana-cost__divider")).toHaveLength(2);
    const mana = container.querySelector(".c500-mana-cost")!;
    expect(mana.firstElementChild?.getAttribute("alt")).toBe("W");
    expect(mana.lastElementChild?.getAttribute("alt")).toBe("B");
  });

  it("symbolGroups takes precedence over symbols when both are given", () => {
    const { container } = render(
      <ManaCostIcons symbols={["X"]} symbolGroups={[["A"], ["B"]]} />,
    );
    expect(container.querySelectorAll(".c500-mana-cost__icon")).toHaveLength(2);
    expect(container.querySelector('img[alt="X"]')).toBeNull();
  });
});
