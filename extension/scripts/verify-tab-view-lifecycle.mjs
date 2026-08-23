import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-lifecycle-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

await new Promise((r) => setTimeout(r, 1000));
const backgroundWorker = context.serviceWorkers().find((w) => w.url().endsWith("background.js"));
const extensionId = backgroundWorker?.url().split("/")[2];
console.log("Extension id:", extensionId);

const sourcePage = await context.newPage();
await sourcePage.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await sourcePage.waitForTimeout(1500);

const [tab] = await backgroundWorker.evaluate(async () => {
  const tabs = await chrome.tabs.query({ url: "*://*.ligamagic.com.br/*" });
  return tabs.map((t) => ({ id: t.id, url: t.url }));
});

const tabIdsBefore = new Set(
  (await backgroundWorker.evaluate(async () => (await chrome.tabs.query({})).map((t) => t.id))) ?? [],
);
const viewTab = await context.newPage();
await viewTab.goto(`chrome-extension://${extensionId}/tab.html?sourceTabId=${tab.id}&deckId=10174508`);
await viewTab.waitForTimeout(1500);

// --- 7.2 (dedup): Chromium's chrome.action.onClicked (and its always-available
// `_execute_action` keyboard-shortcut equivalent, tried and confirmed not to
// work either — Chrome dispatches extension-command accelerators at the
// browser-chrome level, which does not receive CDP-injected key/mouse events)
// cannot be triggered by browser automation. There is no way to make Chromium
// fire a second, genuine onClicked event under Playwright, so the literal
// "click again" gesture is left to service-worker.test.ts's coverage of all
// three handleActionClicked branches (task 2.2), including this one.
//
// What IS live-verifiable without a real click is that the real
// chrome.storage.session + chrome.tabs APIs behave the way the dedup branch's
// logic (getOpenViewTabId) assumes: a mapping recorded for a still-open tab
// resolves to that same tab id via a real chrome.tabs.get lookup, not a
// not-found/needs-recreation result.
// tab.url is hidden here because Playwright (not the extension) created this
// tab; a real onClicked-created tab is exempt from that restriction since the
// extension owns it. Diffing tab ids sidesteps that Playwright-only artifact.
const tabIdsAfter = await backgroundWorker.evaluate(async () => (await chrome.tabs.query({})).map((t) => t.id));
const viewTabId = tabIdsAfter.find((id) => !tabIdsBefore.has(id));
await backgroundWorker.evaluate(
  async ({ sourceTabId, viewTabId }) => {
    await chrome.storage.session.set({
      [`view-tab:${sourceTabId}`]: viewTabId,
      [`source-tab:${viewTabId}`]: sourceTabId,
    });
  },
  { sourceTabId: tab.id, viewTabId },
);
const dedupLookup = await backgroundWorker.evaluate(async (sourceTabId) => {
  const stored = await chrome.storage.session.get(`view-tab:${sourceTabId}`);
  const mappedId = stored[`view-tab:${sourceTabId}`];
  if (mappedId === undefined) return { found: false };
  const viewTab = await chrome.tabs.get(mappedId);
  return { found: true, mappedId, resolvedId: viewTab.id };
}, tab.id);
console.log("7.2 real storage+tabs dedup contract:", dedupLookup);
console.log(
  "7.2 (partial — see script comment):",
  dedupLookup.found && dedupLookup.mappedId === dedupLookup.resolvedId ? "PASS" : "FAIL",
);

// --- 7.3: closing the real source tab needs no toolbar click at all —
// chrome.tabs.onRemoved fires for real when Playwright closes the page.
await sourcePage.close();
await viewTab.waitForTimeout(1500);

const unsyncedText = await viewTab.textContent(".c500-tab__unsynced").catch(() => null);
console.log("7.3 unsynced indicator text:", unsyncedText);
console.log("7.3 result:", unsyncedText ? "PASS" : "FAIL");

const zoneHeadersAfterClose = await viewTab.$$eval(".c500-zone__header", (els) =>
  els.map((e) => e.textContent),
);
console.log("Last-known deck state still visible after source closed:", zoneHeadersAfterClose);

await context.close();
