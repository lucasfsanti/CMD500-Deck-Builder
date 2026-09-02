import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-drag-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  // Generously tall so the drag source (deep in Main Deck's list) and the
  // drag target (the hero column) are both on-screen at once — dnd-kit
  // drives drags via raw pointer events, not native HTML5 drag-and-drop, so
  // a scripted mouse.move sequence never auto-scrolls mid-drag the way a
  // locator .click() would.
  viewport: { width: 1600, height: 3200 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
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

// Playwright cannot click a real browser toolbar icon (it's native Chrome UI,
// not part of any page's DOM), so this drives the same observable path a
// click would: navigate directly to the tab.html URL chrome.tabs.create
// would open (sourceTabId + deckId — the exact shape asserted in
// service-worker.test.ts). The deck view lives entirely in this separate
// tab, not as an overlay injected into the source LigaMagic page.
const [tab] = await backgroundWorker.evaluate(async () => {
  const tabs = await chrome.tabs.query({ url: "*://*.ligamagic.com.br/*" });
  return tabs.map((t) => ({ id: t.id, url: t.url }));
});
console.log("Source tab as seen by the background:", tab);

const page = await context.newPage();
await page.goto(`chrome-extension://${extensionId}/tab.html?sourceTabId=${tab.id}&deckId=10174508`);
// Give Scryfall enrichment time to resolve (per verify-tab-view.mjs) before
// measuring any card's position — cards get re-grouped/re-sorted as
// enrichment resolves progressively, so measuring too early risks grabbing
// stale coordinates that no longer belong to "Llanowar Elves" by the time
// the mouse actually arrives (confirmed while building this script: a short
// wait intermittently dragged a *different* card that happened to occupy
// the same pixel position pre-settle).
await page.waitForTimeout(20000);

// Drag Llanowar Elves (Main Deck) into Companheiro (Comandante Parceiro's
// hero-column display label — see ZONE_LABELS in ZoneSection.tsx). Grab the
// name span specifically, not the row's qty <input> (which intentionally
// stops pointerdown propagation so clicking it doesn't start a drag).
const cardName = page.locator(".c500-card .c500-card__name", { hasText: "Llanowar Elves" }).first();
const targetZone = page.locator(".c500-zone", { hasText: "Companheiro" }).locator(".c500-zone__dropzone");

const cardBox = await cardName.boundingBox();
const targetBox = await targetZone.boundingBox();

console.log("Card row found:", Boolean(cardBox));
console.log("Companheiro dropzone found:", Boolean(targetBox));

if (cardBox && targetBox) {
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cardBox.x + cardBox.width / 2 + 10, cardBox.y + cardBox.height / 2 + 10, {
    steps: 5,
  });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Companheiro is a hero zone, forced into Visual mode regardless of the
  // global view toggle (see ZoneSection's `hero` prop) — a card that lands
  // here renders as a .c500-tile, not a .c500-card.
  const targetHasCard = await page
    .locator(".c500-zone", { hasText: "Companheiro" })
    .locator(".c500-card, .c500-tile", { hasText: "Llanowar Elves" })
    .count();
  console.log("Llanowar Elves now in Companheiro zone:", targetHasCard > 0);
}

await page.screenshot({ path: "verify-drag-result.png" });
await context.close();
