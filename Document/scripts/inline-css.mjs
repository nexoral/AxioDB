/**
 * Inline the app stylesheet into the <head> of every prerendered page.
 *
 * Vite emits the site's CSS as a single render-blocking <link rel="stylesheet">
 * (app-*.css). By inlining that CSS into a <style> tag, the browser no longer
 * has to fetch a separate stylesheet before it can paint the first frame - a
 * real win for FCP/LCP on throttled mobile (this is the "render-blocking
 * requests" audit). Because the full stylesheet is inlined there is no
 * flash-of-unstyled-content; the trade-off is a slightly larger HTML document,
 * which is fine for these static docs pages.
 *
 * Runs as part of `postbuild`, after the SSG pass has written AxioDB_Docs/.
 * Plain Node, no dependencies.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "AxioDB_Docs");

// Matches Vite's injected stylesheet link. crossorigin may be present or empty.
const LINK_RE = /<link[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g;

const files = readdirSync(outDir).filter((f) => f.endsWith(".html"));
let inlined = 0;
const inlinedCssFiles = new Set();

for (const file of files) {
  const path = join(outDir, file);
  const html = readFileSync(path, "utf8");

  const next = html.replace(LINK_RE, (match, href) => {
    const cssPath = join(outDir, href.replace(/^\//, ""));
    if (!existsSync(cssPath)) return match; // leave as-is if something's off
    inlinedCssFiles.add(cssPath);
    const css = readFileSync(cssPath, "utf8");
    return `<style>${css}</style>`;
  });

  if (next !== html) {
    writeFileSync(path, next);
    inlined++;
  }
}

// The CSS is now inline in every page; the standalone asset is dead weight.
for (const cssPath of inlinedCssFiles) {
  try {
    unlinkSync(cssPath);
  } catch {
    /* already gone */
  }
}

console.log(
  `[inline-css] inlined stylesheet into ${inlined}/${files.length} pages, removed ${inlinedCssFiles.size} .css asset(s)`,
);