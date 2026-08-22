import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-legal-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

const page = await context.newPage();
await page.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(8000);

console.log("Legality (Commander 500):", (await page.locator(".c500-legality").textContent())?.trim());

await page.locator(".c500-panel__format").selectOption("commander500Duel");
await page.waitForTimeout(500);

console.log(
  "Legality (Commander 500 Duel):",
  (await page.locator(".c500-legality").textContent())?.trim(),
);

await page.screenshot({ path: "verify-legality-duel.png" });
await context.close();
