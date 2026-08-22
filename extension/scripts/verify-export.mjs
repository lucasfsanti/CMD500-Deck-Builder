import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-export-"));
const downloadDir = mkdtempSync(path.join(tmpdir(), "c500-ext-downloads-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  permissions: ["clipboard-read", "clipboard-write"],
  acceptDownloads: true,
});

const page = await context.newPage();
await page.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(1500);

await page.locator(".c500-export__button", { hasText: "Copy" }).click();
const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
console.log("--- LigaMagic-import export (first 5 lines) ---");
console.log(clipboardText.split("\n").slice(0, 5).join("\n"));
console.log("Contains 'Comandante' header (should be false):", clipboardText.includes("Comandante"));

async function testDownload(label) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(".c500-export__button", { hasText: "Download" }).click(),
  ]);
  const filePath = path.join(downloadDir, `${label}-${download.suggestedFilename()}`);
  await download.saveAs(filePath);
  const content = readFileSync(filePath, "utf8");
  console.log(`--- ${label} download (${download.suggestedFilename()}, first 3 lines) ---`);
  console.log(content.split("\n").slice(0, 3).join("\n"));
  return content;
}

const ligaDownload = await testDownload("ligamagic");
console.log("LigaMagic download matches clipboard text:", ligaDownload === clipboardText);

await page.locator(".c500-export__format").selectOption("readable");
await page.locator(".c500-export__button", { hasText: "Copy" }).click();
const readableText = await page.evaluate(() => navigator.clipboard.readText());
console.log("--- Readable export (first 5 lines) ---");
console.log(readableText.split("\n").slice(0, 5).join("\n"));
console.log("Contains 'Comandante' header (should be true):", readableText.includes("Comandante"));

const readableDownload = await testDownload("readable");
console.log("Readable download matches clipboard text:", readableDownload === readableText);

await context.close();
