import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-bugfix-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

await new Promise((r) => setTimeout(r, 1000));
const backgroundWorker = context.serviceWorkers().find((w) => w.url().endsWith("background.js"));
const extensionId = backgroundWorker?.url().split("/")[2];
console.log("Extension id:", extensionId);

const scryfallRequests = [];
context.on("request", (req) => {
  if (req.url().includes("api.scryfall.com")) scryfallRequests.push(req.url());
});

const sourcePage = await context.newPage();
await sourcePage.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10171831", {
  waitUntil: "domcontentloaded",
});
await sourcePage.waitForTimeout(1500);

const [tab] = await backgroundWorker.evaluate(async () => {
  const tabs = await chrome.tabs.query({ url: "*://*.ligamagic.com.br/*" });
  return tabs.map((t) => ({ id: t.id, url: t.url }));
});

const viewPage = await context.newPage();
await viewPage.goto(`chrome-extension://${extensionId}/tab.html?sourceTabId=${tab.id}&deckId=10171831`);

// Give the batched enrichment call(s) time to complete.
await viewPage.waitForTimeout(8000);

console.log("\n=== 6.3: Scryfall request volume (should be a handful, not ~90) ===");
console.log("Total Scryfall requests:", scryfallRequests.length);
const collectionCalls = scryfallRequests.filter((u) => u.includes("/cards/collection")).length;
const fuzzyCalls = scryfallRequests.filter((u) => u.includes("/cards/named")).length;
console.log("Collection (batch) calls:", collectionCalls, "| Fuzzy fallback calls:", fuzzyCalls);
console.log(scryfallRequests.length < 20 ? "PASS: bounded request volume" : "FAIL: too many requests");

console.log("\n=== 6.3: Legality resolves ===");
const legalityText = await viewPage.textContent(".c500-legality").catch(() => null);
console.log("Legality panel text:", legalityText);
console.log(
  legalityText && !legalityText.includes("Unable to verify") ? "PASS: legality resolved" : "FAIL: still unresolved",
);

console.log("\n=== 6.2: Budget scope (Main Deck + Comandante Parceiro only) ===");
const budgetAmountText = await viewPage.textContent(".c500-gauge__amount").catch(() => null);
console.log("Displayed budget total:", budgetAmountText);

const captureDump = await backgroundWorker.evaluate(async (sourceTabId) => {
  const key = `capture:${sourceTabId}`;
  const result = await chrome.storage.session.get(key);
  return result[key];
}, tab.id);
const BASIC_LANDS = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"]);
let expectedTotal = 0;
let sideboardMaybeboardTotal = 0;
for (const card of captureDump?.cards ?? []) {
  const price = (card.pageLowestPrice ?? 0) * card.quantity;
  if ((card.zone === "mainDeck" || card.zone === "comandanteParceiro") && !BASIC_LANDS.has(card.name)) {
    expectedTotal += price;
  }
  if (card.zone === "sideboard" || card.zone === "maybeboard") {
    sideboardMaybeboardTotal += price;
  }
}
console.log("Independently computed expected total (Main Deck + Comandante Parceiro):", expectedTotal.toFixed(2));
console.log("Sideboard+Maybeboard total (should NOT be included):", sideboardMaybeboardTotal.toFixed(2));
const displayedNumber = Number.parseFloat((budgetAmountText ?? "").replace(/[^\d,]/g, "").replace(",", "."));
console.log(
  Math.abs(displayedNumber - expectedTotal) < 0.01
    ? "PASS: displayed total matches Main Deck + Comandante Parceiro only"
    : `FAIL: displayed ${displayedNumber} != expected ${expectedTotal.toFixed(2)}`,
);

console.log("\n=== 6.5: Type distribution (should span multiple real types, not just Creature/Other) ===");
const typeGroupLabels = await viewPage.$$eval(".c500-group__label", (els) => els.map((e) => e.textContent));
console.log("Zone group labels (Type axis, default):", typeGroupLabels);

console.log("\n=== 6.5: Switch grouping axis to Color ===");
await viewPage.getByLabel("Group by").selectOption("color");
await viewPage.waitForTimeout(500);
const colorGroupLabels = await viewPage.$$eval(".c500-group__label", (els) => els.map((e) => e.textContent));
console.log("Zone group labels (Color axis):", colorGroupLabels);

console.log("\n=== 6.5: Switch grouping axis to Mana Cost ===");
await viewPage.getByLabel("Group by").selectOption("cmc");
await viewPage.waitForTimeout(500);
const cmcGroupLabels = await viewPage.$$eval(".c500-group__label", (els) => els.map((e) => e.textContent));
console.log("Zone group labels (Mana Cost axis):", cmcGroupLabels);

console.log("\n=== 6.4: Visual view artwork coverage ===");
await viewPage.getByRole("button", { name: "Visual" }).click();
await viewPage.waitForTimeout(1000);
const imgCount = await viewPage.locator(".c500-tile__img").count();
const placeholderCount = await viewPage.locator(".c500-tile__placeholder").count();
console.log("Resolved artwork tiles:", imgCount, "| Placeholders:", placeholderCount);
console.log(
  imgCount > 0 && placeholderCount / (imgCount + placeholderCount) < 0.1
    ? "PASS: most cards show real artwork"
    : "Check manually",
);

// Wait for the actual image bytes to download (161 external requests to
// LigaMagic's CDN) before screenshotting, so the screenshot reflects loaded
// artwork rather than <img> tags mid-fetch.
await viewPage.waitForFunction(() => {
  const imgs = Array.from(document.querySelectorAll(".c500-tile__img"));
  return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
}, { timeout: 30000 }).catch(() => console.log("(some images still loading after 30s)"));

await viewPage.locator(".c500-tab__zones").scrollIntoViewIfNeeded();
await viewPage.screenshot({ path: "verify-bugfixes-full.png", fullPage: true });
await viewPage.locator(".c500-tab__sidebar").screenshot({ path: "verify-bugfixes-sidebar.png" });
await viewPage
  .locator(".c500-tile-grid")
  .first()
  .screenshot({ path: "verify-bugfixes-tiles.png" })
  .catch(() => {});

await context.close();
