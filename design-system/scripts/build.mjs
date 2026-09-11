import * as esbuild from "esbuild";
import { rmSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.dirname(root);
const outdir = path.join(root, "dist");

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

// Vendor the extension's real stylesheet into the package. This is a build
// step, not a hand-maintained copy — it always mirrors whatever panel.css
// currently ships, and design-sync's cssEntry must resolve inside this
// package (it's uploaded verbatim), so a copy one directory up won't do.
const vendorDir = path.join(root, "vendor");
mkdirSync(vendorDir, { recursive: true });
copyFileSync(
  path.join(repoRoot, "extension/src/ui/panel.css"),
  path.join(vendorDir, "panel.css"),
);

await esbuild.build({
  entryPoints: { index: path.join(root, "src/index.ts") },
  bundle: true,
  outdir,
  format: "esm",
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  loader: { ".json": "json" },
  logLevel: "info",
});

console.log("Built design-system/dist/index.js");
