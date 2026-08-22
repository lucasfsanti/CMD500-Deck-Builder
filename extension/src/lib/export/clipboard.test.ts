import { describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard (task 7.2)", () => {
  it("writes the given text to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    await copyToClipboard("1 Sol Ring");

    expect(writeText).toHaveBeenCalledWith("1 Sol Ring");
  });
});
