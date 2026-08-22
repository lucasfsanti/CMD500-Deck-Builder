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
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

const page = await context.newPage();
await page.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(3000);

const host = page.locator("#commander-500-deckbuilder-root");
const shadow = host.locator(":scope"); // Playwright pierces shadow DOM automatically for locators

// Drag Llanowar Elves (Main Deck) into Comandante Parceiro, which sits right
// below Comandante and is visible without scrolling the panel's own internal
// scroll container (a raw mouse.move drag doesn't auto-scroll like a locator
// .click() would). Grab the name span specifically, not the row's qty
// <input> (which intentionally stops pointerdown propagation so clicking it
// doesn't start a drag).
const cardName = page.locator(".c500-card .c500-card__name", { hasText: "Llanowar Elves" }).first();
const targetZone = page
  .locator(".c500-zone", { hasText: "Comandante Parceiro" })
  .locator(".c500-zone__dropzone");

const cardBox = await cardName.boundingBox();
const targetBox = await targetZone.boundingBox();

console.log("Card row found:", Boolean(cardBox));
console.log("Sideboard dropzone found:", Boolean(targetBox));

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

  const targetHasCard = await page
    .locator(".c500-zone", { hasText: "Comandante Parceiro" })
    .locator(".c500-card", { hasText: "Llanowar Elves" })
    .count();
  console.log("Llanowar Elves now in Comandante Parceiro zone:", targetHasCard > 0);
}

await page.screenshot({ path: "verify-drag-result.png" });
await context.close();
