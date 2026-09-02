import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { QuantityStepper } from "./QuantityStepper";
import type { DeckCard } from "../../lib/deck/types";

function card(quantity: number): DeckCard {
  return {
    id: "a",
    name: "Island",
    quantity,
    zone: "mainDeck",
    pageLowestPrice: 0.1,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
    enrichment: undefined,
    enrichmentStatus: "pending",
  };
}

describe("QuantityStepper", () => {
  it("increments via the + button", () => {
    const onQuantityChange = vi.fn();
    const { getByLabelText } = render(
      <QuantityStepper card={card(5)} name="Island" onQuantityChange={onQuantityChange} onRemove={vi.fn()} />,
    );
    fireEvent.click(getByLabelText("aumentar quantidade de Island"));
    expect(onQuantityChange).toHaveBeenCalledWith("a", 6);
  });

  it("decrements via the − button when above 1", () => {
    const onQuantityChange = vi.fn();
    const { getByLabelText } = render(
      <QuantityStepper card={card(5)} name="Island" onQuantityChange={onQuantityChange} onRemove={vi.fn()} />,
    );
    fireEvent.click(getByLabelText("diminuir quantidade de Island"));
    expect(onQuantityChange).toHaveBeenCalledWith("a", 4);
  });

  it("calls onRemove instead of onQuantityChange when − would reach 0", () => {
    const onQuantityChange = vi.fn();
    const onRemove = vi.fn();
    const { getByLabelText } = render(
      <QuantityStepper card={card(1)} name="Island" onQuantityChange={onQuantityChange} onRemove={onRemove} />,
    );
    fireEvent.click(getByLabelText("diminuir quantidade de Island"));
    expect(onRemove).toHaveBeenCalledWith("a");
    expect(onQuantityChange).not.toHaveBeenCalled();
  });

  it("calls onRemove instead of onQuantityChange when the user types 0", () => {
    const onQuantityChange = vi.fn();
    const onRemove = vi.fn();
    const { getByLabelText } = render(
      <QuantityStepper card={card(5)} name="Island" onQuantityChange={onQuantityChange} onRemove={onRemove} />,
    );
    fireEvent.change(getByLabelText("quantidade de Island"), { target: { value: "0" } });
    expect(onRemove).toHaveBeenCalledWith("a");
    expect(onQuantityChange).not.toHaveBeenCalled();
  });

  it("calls onQuantityChange when the user types a positive value", () => {
    const onQuantityChange = vi.fn();
    const { getByLabelText } = render(
      <QuantityStepper card={card(5)} name="Island" onQuantityChange={onQuantityChange} onRemove={vi.fn()} />,
    );
    fireEvent.change(getByLabelText("quantidade de Island"), { target: { value: "20" } });
    expect(onQuantityChange).toHaveBeenCalledWith("a", 20);
  });

  it("does not trigger a drag when clicking the + button, the − button, or the input", () => {
    const ancestorPointerDown = vi.fn();
    const { getByLabelText } = render(
      <div onPointerDown={ancestorPointerDown}>
        <QuantityStepper card={card(5)} name="Island" onQuantityChange={vi.fn()} onRemove={vi.fn()} />
      </div>,
    );

    fireEvent.pointerDown(getByLabelText("aumentar quantidade de Island"));
    fireEvent.pointerDown(getByLabelText("diminuir quantidade de Island"));
    fireEvent.pointerDown(getByLabelText("quantidade de Island"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });
});
