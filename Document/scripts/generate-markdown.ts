/**
 * Emits a Markdown twin of every prerendered page (features.html ->
 * features.md) so agents can read the docs without parsing the site's HTML.
 *
 * Runs after the build (package.json "postbuild") because it reads
 * vite-react-ssg's prerendered output - that keeps the .tsx components the
 * single source of truth for page content, instead of maintaining a parallel
 * set of hand-written Markdown files that would immediately drift.
 *
 * functions/_middleware.js serves these in response to "Accept: text/markdown".
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
import { routeMeta } from "../src/routeMeta.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://axiodb.in";
const outDir = resolve(__dirname, "../AxioDB_Docs");

const labelByPath = new Map(routeMeta.map(({ path, label }) => [path, label]));

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// The docs render code through prism-react-renderer (src/components/ui/CodeBlock.tsx):
// one <div> per line inside <pre><code>, each starting with a gutter <span>
// holding the line number. Turndown's default rule sees only text, so it would
// produce a wall of run-together characters with the line numbers glued in.
turndown.addRule("prismCodeBlock", {
  filter: (node) => node.nodeName === "PRE",
  replacement: (_content, node) => {
    const lines = Array.from(node.querySelectorAll("code > div"));
    const code = (
      lines.length > 0
        ? lines
            .map((line) =>
              Array.from(line.children)
                .filter((child) => !child.hasAttribute("data-line-number"))
                .map((child) => child.textContent ?? "")
                .join(""),
            )
            .join("\n")
        : (node.textContent ?? "")
    ).replace(/\s+$/, "");

    const language = node.parentElement?.getAttribute("data-code-language")?.trim() ?? "";
    return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  },
});

// The chrome above each code block (language chip + copy button) is UI, not
// content - the language is re-attached to the fence above instead.
turndown.addRule("dropCodeBlockHeader", {
  filter: (node) => node.hasAttribute("data-code-header"),
  replacement: () => "",
});

// Decorative-only elements: blurred gradient blobs, icon <svg>s, and buttons.
turndown.remove(["script", "style", "svg", "button", "noscript"]);

/** Pulls the single <main> region out of a prerendered page. */
function extractMain(html: string): string | null {
  const start = html.indexOf("<main");
  if (start === -1) return null;
  const open = html.indexOf(">", start);
  const end = html.lastIndexOf("</main>");
  if (open === -1 || end === -1 || end < open) return null;
  return html.slice(open + 1, end);
}

/** "AxioDB_Docs/create-database.html" -> "/create-database" */
function routeForFile(file: string): string {
  return file === "index.html" ? "/" : `/${file.replace(/\.html$/, "")}`;
}

let written = 0;
for (const file of readdirSync(outDir).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(join(outDir, file), "utf-8");
  const main = extractMain(html);
  if (!main) {
    console.warn(`[generate-markdown] no <main> in ${file}, skipped`);
    continue;
  }

  const route = routeForFile(file);
  const title = labelByPath.get(route) ?? "AxioDB";
  const body = turndown.turndown(main).replace(/\n{3,}/g, "\n\n").trim();

  const markdown = `---
title: ${JSON.stringify(`${title} - AxioDB`)}
source: ${SITE_URL}${route}
---

${body}

---

Full AxioDB documentation as one file: ${SITE_URL}/llms-full.txt
`;

  writeFileSync(join(outDir, file.replace(/\.html$/, ".md")), markdown);
  written += 1;
}

console.log(`[generate-markdown] wrote ${written} Markdown twins into AxioDB_Docs/.`);
