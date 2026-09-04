import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Builds the standalone, offline demo (extension/src/demo/) — a static page
 * with a mock decklist, meant for GitHub Pages, not the packaged Chrome
 * extension. Output goes to <repo root>/docs/ (GitHub Pages' "deploy from
 * branch, /docs folder" source), kept completely separate from
 * extension/dist/, which is the real extension build (see build.mjs).
 */

const extensionRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(extensionRoot);
const outdir = path.join(repoRoot, "docs");

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

await esbuild.build({
  entryPoints: { demo: path.join(extensionRoot, "src/demo/demo-entry.tsx") },
  bundle: true,
  outdir,
  format: "iife",
  target: "chrome110",
  sourcemap: true,
  minify: true,
  logLevel: "info",
  loader: { ".json": "json", ".css": "text" },
});

cpSync(path.join(extensionRoot, "demo/index.html"), path.join(outdir, "index.html"));
mkdirSync(path.join(outdir, "icons"), { recursive: true });
for (const icon of ["icon16.png", "icon48.png", "icon128.png"]) {
  cpSync(path.join(extensionRoot, "public/icons", icon), path.join(outdir, "icons", icon));
}
