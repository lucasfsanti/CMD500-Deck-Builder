import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-headergap-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1600, height: 3200 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

await new Promise((r) => setTimeout(r, 1000));
const workers = context.serviceWorkers();
const backgroundWorker = workers.find((w) => w.url().endsWith("background.js"));
const extensionId = backgroundWorker?.url().split("/")[2];

const sourcePage = await context.newPage();
await sourcePage.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await sourcePage.waitForTimeout(1500);

const [tab] = await backgroundWorker.evaluate(async () => {
  const tabs = await chrome.tabs.query({ url: "*://*.ligamagic.com.br/*" });
  return tabs.map((t) => ({ id: t.id, url: t.url }));
});

const page = await context.newPage();
await page.goto(`chrome-extension://${extensionId}/tab.html?sourceTabId=${tab.id}&deckId=10174508`);
await page.waitForTimeout(20000);

// --- 1. Header layout: toggle in the same corner, with or without a filter ---
async function toggleCornerOffset(zoneLabel) {
  const zone = page.locator(".c500-zone", { hasText: zoneLabel }).first();
  const header = zone.locator(".c500-zone__header").first();
  const toggle = header.locator(".c500-zone__toggle");
  const headerBox = await header.boundingBox();
  const toggleBox = await toggle.boundingBox();
  return { rightGap: headerBox.x + headerBox.width - (toggleBox.x + toggleBox.width), topGap: toggleBox.y - headerBox.y };
}

const mainDeckOffset = await toggleCornerOffset("Main Deck");
const comandanteOffset = await toggleCornerOffset("Comandante");
console.log("Main Deck toggle offset from header's top-right corner:", mainDeckOffset);
console.log("Comandante toggle offset from header's top-right corner:", comandanteOffset);

const mainDeckHeader = page.locator(".c500-zone", { hasText: "Main Deck" }).first().locator(".c500-zone__header").first();
const mainDeckHeaderBox = await mainDeckHeader.boundingBox();
const filterBox = await mainDeckHeader.locator(".c500-zone__filter").boundingBox();
const filterCenterX = filterBox.x + filterBox.width / 2;
const headerCenterX = mainDeckHeaderBox.x + mainDeckHeaderBox.width / 2;
console.log("Main Deck filter center vs header center (px):", filterCenterX.toFixed(1), "vs", headerCenterX.toFixed(1));

// --- 2. Gap preview: dragging a card within Main Deck shifts a neighbor, and hides the original ---
const cards = page.locator(".c500-zone", { hasText: "Main Deck" }).first().locator(".c500-card");
const firstCard = cards.nth(0);
const thirdCard = cards.nth(2);

const firstBoxBefore = await firstCard.boundingBox();
const thirdBoxBefore = await thirdCard.boundingBox();
const firstName = await firstCard.locator(".c500-card__name").textContent();
const thirdName = await thirdCard.locator(".c500-card__name").textContent();
console.log(`Dragging "${firstName}" toward "${thirdName}"'s position`);

await page.mouse.move(firstBoxBefore.x + 20, firstBoxBefore.y + firstBoxBefore.height / 2);
await page.mouse.down();
await page.mouse.move(firstBoxBefore.x + 20, firstBoxBefore.y + 10, { steps: 5 });
await page.mouse.move(thirdBoxBefore.x + 20, thirdBoxBefore.y + thirdBoxBefore.height / 2, { steps: 15 });
await page.waitForTimeout(300);

const firstRowOpacityMidDrag = await firstCard.evaluate((el) => getComputedStyle(el).opacity);
const secondCardBoxMidDrag = await cards.nth(1).boundingBox();
console.log("Original dragged row's computed opacity mid-drag (expect ~0):", firstRowOpacityMidDrag);

await page.mouse.up();
await page.waitForTimeout(500);

const secondCardBoxAfter = await page
  .locator(".c500-zone", { hasText: "Main Deck" })
  .first()
  .locator(".c500-card")
  .nth(1)
  .boundingBox();
console.log("A neighbor's box mid-drag vs after-drop (shift expected to settle):", secondCardBoxMidDrag, secondCardBoxAfter);

// --- 3. Cross-zone hover: dragging a Main Deck card over Comandante must not
// shift anything inside Comandante (only same-group reorders open a gap) ---
const comandanteCard = page.locator(".c500-zone", { hasText: "Comandante" }).first().locator(".c500-tile, .c500-card").first();
const comandanteBoxBefore = await comandanteCard.boundingBox();

const dragCard = cards.nth(0);
const dragBoxBefore = await dragCard.boundingBox();
await page.mouse.move(dragBoxBefore.x + 20, dragBoxBefore.y + dragBoxBefore.height / 2);
await page.mouse.down();
await page.mouse.move(dragBoxBefore.x + 20, dragBoxBefore.y - 10, { steps: 5 });
await page.mouse.move(comandanteBoxBefore.x + comandanteBoxBefore.width / 2, comandanteBoxBefore.y + comandanteBoxBefore.height / 2, {
  steps: 15,
});
await page.waitForTimeout(300);
const comandanteBoxDuring = await comandanteCard.boundingBox();
console.log(
  "Comandante card box before vs during a Main Deck card hovering over it (expect unchanged):",
  comandanteBoxBefore,
  comandanteBoxDuring,
);
await page.mouse.move(dragBoxBefore.x + 20, dragBoxBefore.y + dragBoxBefore.height / 2, { steps: 15 });
await page.waitForTimeout(300);
await page.mouse.up();
await page.waitForTimeout(500);

// --- 4. Main Deck multi-column List view: reorder within one column group
// (CRIATURA) and confirm the shift stays within that column, doesn't leak
// into the neighboring column ---
const mainDeckZone = page.locator(".c500-zone", { hasText: "Main Deck" }).first();
const criaturaCards = mainDeckZone.locator(".c500-zone__dropzone--columns .c500-card");
const criaturaFirst = criaturaCards.nth(0);
const criaturaThird = criaturaCards.nth(2);
const feiticoGroup = mainDeckZone.locator("text=FEITIÇO").first();
const feiticoBoxBefore = await feiticoGroup.boundingBox();

const criFirstBox = await criaturaFirst.boundingBox();
const criThirdBox = await criaturaThird.boundingBox();
const criFirstName = await criaturaFirst.locator(".c500-card__name").textContent();
const criThirdName = await criaturaThird.locator(".c500-card__name").textContent();
console.log(`Reordering within CRIATURA column: "${criFirstName}" toward "${criThirdName}"`);

await page.mouse.move(criFirstBox.x + 20, criFirstBox.y + criFirstBox.height / 2);
await page.mouse.down();
await page.mouse.move(criFirstBox.x + 20, criFirstBox.y + 10, { steps: 5 });
await page.mouse.move(criThirdBox.x + 20, criThirdBox.y + criThirdBox.height / 2, { steps: 15 });
await page.waitForTimeout(300);
const feiticoBoxDuring = await feiticoGroup.boundingBox();
console.log(
  "FEITIÇO column header box before vs during a same-column CRIATURA drag (expect unchanged, i.e. no cross-column leak):",
  feiticoBoxBefore,
  feiticoBoxDuring,
);
await page.mouse.up();
await page.waitForTimeout(500);

// --- 5. Visual view: gap preview also works for tiles ---
await page.getByRole("button", { name: "Ver em modo visual" }).click();
await page.waitForTimeout(500);
const tiles = page.locator(".c500-zone", { hasText: "Main Deck" }).first().locator(".c500-tile");
const tileFirstBox = await tiles.nth(0).boundingBox();
const tileThirdBox = await tiles.nth(2).boundingBox();
const tileSecondBoxBefore = await tiles.nth(1).boundingBox();
await page.mouse.move(tileFirstBox.x + tileFirstBox.width / 2, tileFirstBox.y + 10);
await page.mouse.down();
await page.mouse.move(tileFirstBox.x + tileFirstBox.width / 2, tileFirstBox.y - 10, { steps: 5 });
await page.mouse.move(tileThirdBox.x + tileThirdBox.width / 2, tileThirdBox.y + tileThirdBox.height / 2, { steps: 15 });
await page.waitForTimeout(300);
const tileFirstOpacityMidDrag = await tiles.nth(0).evaluate((el) => getComputedStyle(el).opacity);
const tileSecondBoxMidDrag = await tiles.nth(1).boundingBox();
console.log("Visual view: dragged tile opacity mid-drag (expect ~0):", tileFirstOpacityMidDrag);
console.log("Visual view: neighbor tile box before-drag vs mid-drag (expect a shift):", tileSecondBoxBefore, tileSecondBoxMidDrag);
await page.mouse.up();
await page.waitForTimeout(500);

await page.screenshot({ path: "verify-header-and-gap-preview.png", fullPage: true });
await context.close();
