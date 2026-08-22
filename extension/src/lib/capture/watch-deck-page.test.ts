import { describe, expect, it } from "vitest";
import { watchPage } from "./watch-deck-page";
import { parseDeckPage } from "./deck-page-parser";

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("watchPage (task 3.4)", () => {
  it("captures immediately on first call", () => {
    const root = document.createElement("div");
    root.innerHTML = '<div id="dk-val-1-1"><div class="pdeck-block"></div></div>';
    const results: string[] = [];

    const stop = watchPage(root, parseDeckPage, (r) => results.push(r.status));

    expect(results).toEqual(["ok"]);
    stop();
  });

  it("re-captures without a manual refresh when the page content changes asynchronously", async () => {
    const root = document.createElement("div");
    root.innerHTML = '<div id="dk-val-1-1"></div>'; // no pdeck-block yet: unrecognized
    document.body.appendChild(root);
    const results: string[] = [];

    const stop = watchPage(root, parseDeckPage, (r) => results.push(r.status));
    expect(results).toEqual(["unrecognized-page"]);

    // Simulate LigaMagic's async data load finishing after document_idle.
    const container = root.querySelector("#dk-val-1-1")!;
    container.innerHTML = '<div class="pdeck-block"></div>';
    await flushMicrotasks();

    expect(results).toEqual(["unrecognized-page", "ok"]);
    stop();
    document.body.removeChild(root);
  });

  it("stops observing once the returned disconnect function is called", async () => {
    const root = document.createElement("div");
    root.innerHTML = '<div id="dk-val-1-1"><div class="pdeck-block"></div></div>';
    document.body.appendChild(root);
    const results: string[] = [];

    const stop = watchPage(root, parseDeckPage, (r) => results.push(r.status));
    stop();

    root.querySelector("#dk-val-1-1")!.innerHTML = "";
    await flushMicrotasks();

    expect(results).toEqual(["ok"]); // no second capture after disconnect
    document.body.removeChild(root);
  });

  it("uses whichever parser is passed in, not a hardcoded one (task: collection pages must use their own parser)", () => {
    const root = document.createElement("div");
    root.innerHTML = "<div>irrelevant to a fake parser</div>";
    const results: string[] = [];
    const fakeParser = () => ({ status: "ok" as const, cards: [] });

    const stop = watchPage(root, fakeParser, (r) => results.push(r.status));

    expect(results).toEqual(["ok"]);
    stop();
  });
});
