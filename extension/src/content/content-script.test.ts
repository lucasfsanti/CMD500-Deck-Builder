import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { relayCapture } from "./content-script";

describe("relayCapture (task 1.2)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the capture result to the background as a captureUpdate message", async () => {
    const sendMessage = vi.fn(async () => ({ type: "captureUpdate", ok: true }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    const result = { status: "ok" as const, cards: [] };
    await relayCapture(result);

    expect(sendMessage).toHaveBeenCalledWith({ type: "captureUpdate", result });
  });
});

describe("content script activation (task 1.2: capture-only, no UI mounted)", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  function setLocation(href: string) {
    // pushState only changes path/query on the same origin; detectLigaMagicPage
    // checks the hostname too, so the test needs a real ligamagic.com.br origin.
    Object.defineProperty(window, "location", { value: new URL(href), writable: true });
  }

  it("relays a capture on a matching page and mounts no UI", async () => {
    const sendMessage = vi.fn(async () => ({ type: "captureUpdate", ok: true }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    setLocation("https://www.ligamagic.com.br/?view=dks/deck&id=1");
    document.body.innerHTML =
      '<div id="dk-val-1-1"><div class="pdeck-block"></div></div>';

    const { stopWatching } = await import("./content-script");

    expect(sendMessage).toHaveBeenCalledWith({
      type: "captureUpdate",
      result: { status: "ok", cards: [] },
    });
    expect(document.getElementById("commander-500-deckbuilder-root")).toBeNull();
    stopWatching?.();
  });

  it("does not relay anything on an unrelated page", async () => {
    const sendMessage = vi.fn(async () => ({ type: "captureUpdate", ok: true }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    setLocation("https://www.ligamagic.com.br/?view=forum/mensagem&id=1");

    await import("./content-script");

    expect(sendMessage).not.toHaveBeenCalled();
    expect(document.getElementById("commander-500-deckbuilder-root")).toBeNull();
  });
});
