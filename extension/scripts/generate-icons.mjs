import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Regenerates the toolbar/manifest icons (icon16/48/128.png) from the
 * "Selo Octogonal" seal mark (logo v2). Colors are hardcoded to the
 * dark-theme values here — not read from CSS custom properties, since a
 * static PNG can't respond to a live theme toggle — per design.md's "one
 * fixed toolbar icon" decision. This is a manually-invoked one-off script
 * (not part of the automatic build): re-run it only when the artwork
 * itself changes.
 */

const DARK_PLATE = "#17171b"; // --c500-bg
const GOLD = "#c9a463"; // --c500-mana-gold
const SOFT = "#8f8d89"; // --c500-text-soft

const SEAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M9.5 22 L22 9.5 L42 9.5 L54.5 22 L54.5 42 L42 54.5 L22 54.5 L9.5 42 Z" fill="${DARK_PLATE}" stroke="${GOLD}" stroke-width="4"/>
  <path d="M19 39 L19 22.5 L25.5 30 L32 20 L38.5 30 L45 22.5 L45 39 Z" fill="${GOLD}"/>
  <rect x="21" y="43" width="22" height="3" fill="${SOFT}"/>
</svg>`;

const extensionRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const iconsDir = path.join(extensionRoot, "public", "icons");

const sizes = [16, 48, 128];

for (const size of sizes) {
  const resvg = new Resvg(SEAL_SVG, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  const outPath = path.join(iconsDir, `icon${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${size}x${size})`);
}
