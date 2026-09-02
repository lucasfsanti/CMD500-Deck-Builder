import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { PriceCell } from "./PriceCell";
import type { DeckCard } from "../../lib/deck/types";

const baseCard: DeckCard = {
  id: "a",
  name: "Sol Ring",
  quantity: 1,
  zone: "mainDeck",
  pageLowestPrice: 4,
  pageImageUrl: undefined,
  pageManaCostSymbols: undefined,
  pageNamePt: undefined,
  enrichment: undefined,
  enrichmentStatus: "pending",
};

function renderCell(props: Partial<Parameters<typeof PriceCell>[0]> = {}) {
  return render(
    <PriceCell card={baseCard} name="Sol Ring" className="c500-card__price" {...props} />,
  );
}

describe("PriceCell", () => {
  it("shows the formatted price read-only when no onPriceChange is given", () => {
    const { getByText, queryByLabelText } = renderCell();
    expect(getByText("R$4,00")).toBeTruthy();
    fireEvent.click(getByText("R$4,00"));
    expect(queryByLabelText("editar preço de Sol Ring")).toBeNull();
  });

  it("shows '—' for an unresolved price", () => {
    const { getByText } = renderCell({ card: { ...baseCard, pageLowestPrice: undefined } });
    expect(getByText("—")).toBeTruthy();
  });

  it("enters edit mode on click and commits a new value on Enter", () => {
    let changed: [string, number | undefined] | undefined;
    const { getByText, getByLabelText } = renderCell({
      onPriceChange: (id, price) => (changed = [id, price]),
    });

    fireEvent.click(getByText("R$4,00"));
    const input = getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "12.5" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(changed).toEqual(["a", 12.5]);
  });

  it("commits on blur", () => {
    let changed: [string, number | undefined] | undefined;
    const { getByText, getByLabelText } = renderCell({
      onPriceChange: (id, price) => (changed = [id, price]),
    });

    fireEvent.click(getByText("R$4,00"));
    const input = getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.blur(input);

    expect(changed).toEqual(["a", 9]);
  });

  it("cancels on Escape without calling onPriceChange", () => {
    const onPriceChange = vi.fn();
    const { getByText, getByLabelText, queryByLabelText } = renderCell({ onPriceChange });

    fireEvent.click(getByText("R$4,00"));
    const input = getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onPriceChange).not.toHaveBeenCalled();
    expect(queryByLabelText("editar preço de Sol Ring")).toBeNull();
    expect(getByText("R$4,00")).toBeTruthy();
  });

  it("rejects a negative value, keeping the previous price", () => {
    const onPriceChange = vi.fn();
    const { getByText, getByLabelText } = renderCell({ onPriceChange });

    fireEvent.click(getByText("R$4,00"));
    const input = getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onPriceChange).not.toHaveBeenCalled();
    expect(getByText("R$4,00")).toBeTruthy();
  });

  it("rejects a non-numeric value, keeping the previous price", () => {
    const onPriceChange = vi.fn();
    const { getByText, getByLabelText } = renderCell({ onPriceChange });

    fireEvent.click(getByText("R$4,00"));
    const input = getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onPriceChange).not.toHaveBeenCalled();
    expect(getByText("R$4,00")).toBeTruthy();
  });

  it("sets a price on a card whose price was previously unresolved", () => {
    let changed: [string, number | undefined] | undefined;
    const { getByText, getByLabelText } = renderCell({
      card: { ...baseCard, pageLowestPrice: undefined },
      onPriceChange: (id, price) => (changed = [id, price]),
    });

    fireEvent.click(getByText("—"));
    const input = getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(changed).toEqual(["a", 3]);
  });

  it("stops pointerdown from bubbling past the read-only display, so it never starts a drag", () => {
    const ancestorPointerDown = vi.fn();
    const { getByText } = render(
      <div onPointerDown={ancestorPointerDown}>
        <PriceCell card={baseCard} name="Sol Ring" className="c500-card__price" onPriceChange={vi.fn()} />
      </div>,
    );

    fireEvent.pointerDown(getByText("R$4,00"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });

  it("stops pointerdown from bubbling past the input while editing", () => {
    const ancestorPointerDown = vi.fn();
    const { getByText, getByLabelText } = render(
      <div onPointerDown={ancestorPointerDown}>
        <PriceCell card={baseCard} name="Sol Ring" className="c500-card__price" onPriceChange={vi.fn()} />
      </div>,
    );

    fireEvent.click(getByText("R$4,00"));
    fireEvent.pointerDown(getByLabelText("editar preço de Sol Ring"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });
});
