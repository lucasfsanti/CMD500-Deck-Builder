import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-zonecollapse-"));

// A generously tall viewport keeps both the drag source (deep in Main Deck's
// list) and the drag target (the hero column) on-screen at once — dnd-kit
// drives drags via raw pointer events, not native HTML5 drag-and-drop, so a
// scripted mouse.move sequence (unlike a locator .click()) never auto-scrolls
// mid-drag. Without this, a real drag between distant zones can't be
// scripted at all, independent of anything this script is checking.
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1600, height: 3200 },
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
await viewPage.waitForTimeout(2000);

// --- 1. Every zone starts expanded, toggle present on all four ---
const initialToggles = await viewPage.$$eval(".c500-zone__toggle", (els) =>
  els.map((el) => ({ ariaExpanded: el.getAttribute("aria-expanded"), label: el.getAttribute("aria-label") })),
);
console.log("Initial toggle states (expect 4, all aria-expanded=true):", initialToggles);

// --- 2. Collapse Main Deck: cards + filter hide, header/count stay ---
const mainDeckZone = viewPage.locator(".c500-zone", { hasText: "Main Deck" }).first();
const mainDeckToggle = mainDeckZone.locator(".c500-zone__toggle");
const mainDeckCountBefore = await mainDeckZone.locator(".c500-zone__count").textContent();
const mainDeckFilterVisibleBefore = await mainDeckZone.locator(".c500-zone__filter").isVisible();

await mainDeckToggle.click();
await viewPage.waitForTimeout(300);

const mainDeckCardsAfterCollapse = await mainDeckZone.locator(".c500-card, .c500-tile").count();
const mainDeckCountAfterCollapse = await mainDeckZone.locator(".c500-zone__count").textContent();
const mainDeckFilterCountAfterCollapse = await mainDeckZone.locator(".c500-zone__filter").count();
const mainDeckDropzoneCollapsed = await mainDeckZone.locator(".c500-zone__dropzone--collapsed").count();
console.log("Main Deck filter visible before collapse (expect true):", mainDeckFilterVisibleBefore);
console.log(
  "Main Deck card count text before/after collapse (should match):",
  mainDeckCountBefore,
  mainDeckCountAfterCollapse,
);
console.log("Main Deck visible card rows/tiles after collapse (expect 0):", mainDeckCardsAfterCollapse);
console.log("Main Deck filter input present after collapse (expect 0):", mainDeckFilterCountAfterCollapse);
console.log("Main Deck dropzone has --collapsed class:", mainDeckDropzoneCollapsed > 0);

await viewPage.screenshot({ path: "verify-zone-collapse-maindeck-collapsed.png", fullPage: true });

// --- 3. Expand Main Deck again: cards + filter reappear ---
await mainDeckToggle.click();
await viewPage.waitForTimeout(300);
const mainDeckCardsAfterExpand = await mainDeckZone.locator(".c500-card, .c500-tile").count();
const mainDeckFilterVisibleAfterExpand = await mainDeckZone.locator(".c500-zone__filter").isVisible();
console.log("Main Deck visible card rows/tiles after re-expand (expect > 0):", mainDeckCardsAfterExpand);
console.log("Main Deck filter visible again after re-expand (expect true):", mainDeckFilterVisibleAfterExpand);

// --- 4. Collapse Companheiro (Comandante Parceiro), then drag a Main Deck
//     card onto it — should move the card AND auto-expand the zone
//     (deck-organizer's "collapsed zone stays a valid drop target" requirement) ---
const parceiroZone = viewPage.locator(".c500-zone", { hasText: "Companheiro" }).first();
const parceiroToggle = parceiroZone.locator(".c500-zone__toggle");
await parceiroToggle.click();
await viewPage.waitForTimeout(300);

const targetBox = await parceiroZone.locator(".c500-zone__dropzone").boundingBox();
const cardName = viewPage.locator(".c500-card .c500-card__name", { hasText: "Llanowar Elves" }).first();
const cardBox = await cardName.boundingBox();
console.log("Companheiro (collapsed) dropzone box found:", Boolean(targetBox));
console.log("Llanowar Elves row found:", Boolean(cardBox));

if (cardBox && targetBox) {
  await viewPage.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await viewPage.mouse.down();
  await viewPage.mouse.move(cardBox.x + cardBox.width / 2 + 10, cardBox.y + cardBox.height / 2 + 10, {
    steps: 5,
  });
  await viewPage.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 10,
  });
  await viewPage.waitForTimeout(200);
  const midDragClass = await parceiroZone.locator(".c500-zone__dropzone").evaluate((el) => el.className);
  console.log("Companheiro dropzone className mid-drag (expect --active present):", midDragClass);

  await viewPage.mouse.up();
  await viewPage.waitForTimeout(500);

  const afterDropClass = await parceiroZone.locator(".c500-zone__dropzone").evaluate((el) => el.className);
  const parceiroHasCard = await parceiroZone
    .locator(".c500-card, .c500-tile", { hasText: "Llanowar Elves" })
    .count();
  console.log(
    "Companheiro dropzone className after drop (expect --collapsed gone):",
    afterDropClass,
  );
  console.log("Llanowar Elves now visible in Companheiro (expect true):", parceiroHasCard > 0);
}

await viewPage.screenshot({ path: "verify-zone-collapse-after-drop.png", fullPage: true });

const extensionErrors = errors.filter((e) => e.startsWith("[chrome-extension:"));
console.log(
  "Console/page errors from our own extension pages only:",
  extensionErrors.length ? extensionErrors : "none",
);

await context.close();
