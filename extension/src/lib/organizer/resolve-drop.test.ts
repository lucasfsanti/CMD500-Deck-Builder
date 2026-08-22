import { describe, expect, it } from "vitest";
import { resolveDropZone } from "./resolve-drop";

describe("resolveDropZone (verification finding #4a: drop outside any zone)", () => {
  it("resolves a recognized zone id", () => {
    expect(resolveDropZone({ over: { id: "sideboard" } })).toBe("sideboard");
  });

  it("returns undefined when dropped outside any droppable (over is null)", () => {
    expect(resolveDropZone({ over: null })).toBeUndefined();
  });

  it("returns undefined when the drop target's id isn't a recognized zone", () => {
    expect(resolveDropZone({ over: { id: "not-a-zone" } })).toBeUndefined();
  });
});
