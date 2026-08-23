import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-tabview-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

const errors = [];
context.on("weberror", (e) => errors.push(`[${e.page()?.url()}] ${e.error().stack ?? e.error()}`));
context.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[${msg.page()?.url()}] ${msg.text()}`);
});

await new Promise((r) => setTimeout(r, 1000));
const workers = context.serviceWorkers();
const backgroundWorker = workers.find((w) => w.url().endsWith("background.js"));
const extensionId = backgroundWorker?.url().split("/")[2];
console.log("Extension id:", extensionId);

const sourcePage = await context.newPage();
await sourcePage.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await sourcePage.waitForTimeout(1500);

const overlayPresent = await sourcePage.evaluate(
  () => document.getElementById("commander-500-deckbuilder-root") !== null,
);
console.log("Overlay injected on source page (should be false):", overlayPresent);

// Playwright cannot click a real browser toolbar icon (it's native Chrome UI,
// not part of any page's DOM), so this drives the same observable path a
// click would: navigate directly to the tab.html URL chrome.tabs.create
// would open (sourceTabId + deckId — the exact shape asserted in
// service-worker.test.ts). This exercises the real tab page against a real
// relayed capture; the "click dispatches this" wiring itself is unit-tested.
const [tab] = await backgroundWorker.evaluate(async () => {
  const tabs = await chrome.tabs.query({ url: "*://*.ligamagic.com.br/*" });
  return tabs.map((t) => ({ id: t.id, url: t.url }));
});
console.log("Source tab as seen by the background:", tab);

const viewPage = await context.newPage();
await viewPage.goto(`chrome-extension://${extensionId}/tab.html?sourceTabId=${tab.id}&deckId=10174508`);
await viewPage.waitForTimeout(2000);

const title = await viewPage.textContent(".c500-tab__title").catch(() => null);
const zoneHeaders = await viewPage.$$eval(".c500-zone__header", (els) => els.map((e) => e.textContent));
const commanderCard = await viewPage.textContent("body").then((t) => t.includes("Xyris"));

console.log("Tab view title:", title);
console.log("Zone headers found:", zoneHeaders);
console.log("Commander card text present:", commanderCard);

// Give enrichment (and thus card art) time to resolve, then switch to Visual view.
await viewPage.waitForTimeout(20000);
await viewPage.getByRole("button", { name: "Visual" }).click();
await viewPage.waitForTimeout(500);

const imgCount = await viewPage.locator(".c500-tile__img").count();
const placeholderCount = await viewPage.locator(".c500-tile__placeholder").count();
console.log("Visual view: resolved artwork tiles:", imgCount, "| placeholders:", placeholderCount);

const extensionErrors = errors.filter((e) => e.startsWith("[chrome-extension:"));
console.log("Console/page errors observed (all):", errors.length ? errors : "none");
console.log("Errors from our own extension pages only:", extensionErrors.length ? extensionErrors : "none");

await viewPage.screenshot({ path: "verify-tab-view.png", fullPage: true });
await viewPage.locator(".c500-tab__sidebar").screenshot({ path: "verify-tab-sidebar.png" });

const trackDebug = await viewPage.evaluate(() => {
  const track = document.querySelector(".c500-chart__track");
  const bar = document.querySelector(".c500-chart__bar");
  if (!track || !bar) return { found: false };
  const trackRect = track.getBoundingClientRect();
  const barRect = bar.getBoundingClientRect();
  const trackStyle = getComputedStyle(track);
  const barStyle = getComputedStyle(bar);
  return {
    found: true,
    trackRect: { w: trackRect.width, h: trackRect.height },
    barRect: { w: barRect.width, h: barRect.height },
    trackBg: trackStyle.backgroundColor,
    barBg: barStyle.backgroundColor,
    barInlineWidth: bar.getAttribute("style"),
  };
});
console.log("Chart bar debug:", trackDebug);

await context.close();
