/**
 * Regenerates public/sitemap.xml and the "## Documentation Pages" section of
 * public/llms.txt from src/routeMeta.ts - the single source of truth for the
 * site's real routes. Run automatically after every build (see package.json's
 * "postbuild" script) so these two files can't silently drift out of sync
 * with the actual router again.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { routeMeta } from "../src/routeMeta.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://axiodb.in";
const today = new Date().toISOString().slice(0, 10);

function buildSitemap(): string {
  const urls = routeMeta
    .map(({ path }) => {
      const isHome = path === "/";
      return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${isHome ? "weekly" : "monthly"}</changefreq>
    <priority>${isHome ? "1.0" : "0.8"}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
  <url>
    <loc>${SITE_URL}/llms.txt</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/llms-full.txt</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`;
}

function updateLlmsTxt(llmsTxtPath: string): void {
  const original = readFileSync(llmsTxtPath, "utf-8");

  const pagesList = routeMeta
    .map(({ path, label }) => `- [${label}](${SITE_URL}${path})`)
    .join("\n");
  const newSection = `## Documentation Pages\n\n${pagesList}\n`;

  // Replace everything between "## Documentation Pages" and the next "## " heading
  // (or end of file), leaving every other section untouched.
  const sectionRegex = /## Documentation Pages\n[\s\S]*?(?=\n## |$)/;
  const updated = sectionRegex.test(original)
    ? original.replace(sectionRegex, newSection)
    : `${original.trimEnd()}\n\n${newSection}`;

  writeFileSync(llmsTxtPath, updated);
}

const publicDir = resolve(__dirname, "../public");
writeFileSync(resolve(publicDir, "sitemap.xml"), buildSitemap());
updateLlmsTxt(resolve(publicDir, "llms.txt"));

console.log(`[generate-seo-files] sitemap.xml and llms.txt updated with ${routeMeta.length} routes.`);
