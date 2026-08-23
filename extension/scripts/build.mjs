import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outdir = path.join(root, "dist");
const watch = process.argv.includes("--watch");

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const buildOptions = {
  entryPoints: {
    background: path.join(root, "src/background/service-worker.ts"),
    content: path.join(root, "src/content/content-script.ts"),
    tab: path.join(root, "src/tab/tab-entry.tsx"),
  },
  bundle: true,
  outdir,
  format: "iife",
  target: "chrome110",
  sourcemap: true,
  minify: !watch,
  logLevel: "info",
  loader: { ".json": "json", ".css": "text" },
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);
}

cpSync(path.join(root, "public"), outdir, { recursive: true });
if (!existsSync(path.join(outdir, "icons"))) {
  mkdirSync(path.join(outdir, "icons"), { recursive: true });
}
