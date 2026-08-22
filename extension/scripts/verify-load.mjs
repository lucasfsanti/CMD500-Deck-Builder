import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionPath = path.join(root, "dist");
const userDataDir = mkdtempSync(path.join(tmpdir(), "c500-ext-"));

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false, // MV3 extensions require the "new" headless mode or headed mode
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

const errors = [];
context.on("weberror", (webError) => errors.push(String(webError.error())));
context.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

// Give the service worker a moment to start and register.
await new Promise((resolve) => setTimeout(resolve, 1500));

const workers = context.serviceWorkers();
const backgroundWorker = workers.find((w) => w.url().endsWith("background.js"));

console.log("Service workers registered:", workers.map((w) => w.url()));
console.log("Background service worker found:", Boolean(backgroundWorker));

const page = await context.newPage();

async function panelIsInjected() {
  return page.evaluate(() => {
    const host = document.getElementById("commander-500-deckbuilder-root");
    if (!host?.shadowRoot) return false;
    return host.shadowRoot.textContent.includes("Commander 500");
  });
}

await page.goto("https://www.ligamagic.com.br/?view=colecao/colecao", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(500);
const injectedOnCollection = await panelIsInjected();

await page.goto("https://www.ligamagic.com.br/?view=dks/deck&id=10174508", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(8000);
await page.screenshot({ path: "verify-load-deck-panel.png" });

await page.goto("https://www.ligamagic.com.br/?view=forum/mensagem&id=1", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(500);
const injectedOnUnrelatedPage = await panelIsInjected();

console.log("Panel injected on collection page:", injectedOnCollection);
console.log("Panel injected on unrelated LigaMagic page:", injectedOnUnrelatedPage);
console.log("Console/page errors observed:", errors.length ? errors : "none");

await context.close();

if (!backgroundWorker || errors.length > 0 || !injectedOnCollection || injectedOnUnrelatedPage) {
  process.exit(1);
}
