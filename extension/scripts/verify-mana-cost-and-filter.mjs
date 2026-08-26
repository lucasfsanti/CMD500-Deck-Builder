import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-manacost-"));

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

const [tab] = await backgroundWorker.evaluate(async () => {
  const tabs = await chrome.tabs.query({ url: "*://*.ligamagic.com.br/*" });
  return tabs.map((t) => ({ id: t.id, url: t.url }));
});
console.log("Source tab as seen by the background:", tab);

const viewPage = await context.newPage();
await viewPage.goto(`chrome-extension://${extensionId}/tab.html?sourceTabId=${tab.id}&deckId=10174508`);
// Let capture + Scryfall enrichment settle.
await viewPage.waitForTimeout(20000);

// --- Mana cost icons -------------------------------------------------
// Xyris is the Commander, always rendered via the hero block (CardVisualTile,
// forced Visual mode) — never CardRow — so it correctly shows 0 mana-cost
// icons regardless of this feature. Check a genuine Main Deck List-view row
// instead: Llanowar Elves, real cost {G}.
const elvesRow = viewPage.locator(".c500-card", { hasText: "Llanowar Elves" }).first();
const elvesManaIcons = await elvesRow.locator(".c500-mana-cost__icon").count();
const elvesIconSrcs = await elvesRow.locator(".c500-mana-cost__icon").evaluateAll((els) =>
  els.map((el) => el.getAttribute("src")),
);
console.log("Llanowar Elves mana-cost icon count (expect 1, for {G}):", elvesManaIcons);
console.log("Llanowar Elves mana-cost icon srcs:", elvesIconSrcs);

const forestRow = viewPage.locator(".c500-card", { hasText: "Forest" }).first();
const forestHasManaCost = await forestRow.locator(".c500-mana-cost").count();
console.log("Forest (land) mana-cost element count (expect 0):", forestHasManaCost);

await viewPage.screenshot({ path: "verify-mana-cost.png", fullPage: true });

// --- Per-zone filter ---------------------------------------------------
const mainDeckFilter = viewPage.getByLabel("filtrar Main Deck por nome");
const maybeboardFilter = viewPage.getByLabel("filtrar Maybeboard por nome");
console.log("Main Deck filter present:", await mainDeckFilter.count());
console.log("Maybeboard filter present:", await maybeboardFilter.count());

const budgetBefore = await viewPage.locator(".c500-gauge__amount").first().textContent();
const cardCountBefore = await viewPage.locator(".c500-gauge__amount").nth(1).textContent();
const legalityBefore = await viewPage.locator(".c500-legality").textContent();

await mainDeckFilter.fill("Llanowar");
await viewPage.waitForTimeout(300);

const mainDeckVisibleAfterFilter = await viewPage
  .locator(".c500-tab__main-row > .c500-zone .c500-card")
  .allTextContents();
console.log("Main Deck cards visible after filtering 'Llanowar':", mainDeckVisibleAfterFilter);

const maybeboardVisibleUnaffected = await viewPage
  .locator(".c500-zone", { hasText: "Maybeboard" })
  .locator(".c500-card")
  .count();
console.log("Maybeboard card count while Main Deck filter is active (should be unaffected):", maybeboardVisibleUnaffected);

const budgetAfter = await viewPage.locator(".c500-gauge__amount").first().textContent();
const cardCountAfter = await viewPage.locator(".c500-gauge__amount").nth(1).textContent();
const legalityAfter = await viewPage.locator(".c500-legality").textContent();

console.log("Budget unaffected by filter:", budgetBefore === budgetAfter, budgetBefore, "->", budgetAfter);
console.log("Card count unaffected by filter:", cardCountBefore === cardCountAfter, cardCountBefore, "->", cardCountAfter);
console.log("Legality unaffected by filter:", legalityBefore === legalityAfter);

await mainDeckFilter.fill("");
await viewPage.waitForTimeout(300);

await viewPage.screenshot({ path: "verify-filter.png", fullPage: true });

console.log("Console/page errors observed:", errors.length ? errors : "none");
const extensionErrors = errors.filter((e) => e.startsWith("[chrome-extension:"));
console.log("Errors from our own extension pages only:", extensionErrors.length ? extensionErrors : "none");

await context.close();
