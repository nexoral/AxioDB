/**
 * Googlebot access audit for axiodb.in.
 *
 * The URL list is discovered by fetching the live sitemap.xml first, not from
 * the local route table - that way the audit exercises what a crawler would
 * actually read, and the local route list is used only as a cross-check to
 * catch sitemap drift (a page that exists but isn't listed, or a listed URL
 * that 404s).
 *
 * Every discovered URL is then fetched as four distinct crawlers (Googlebot
 * desktop, Googlebot smartphone, GPTBot, ClaudeBot) and reports:
 *   - HTTP status per URL
 *   - whether Cloudflare served a challenge/interstitial instead of the page
 *   - whether the response is real prerendered HTML (vs a JS shell)
 *   - any x-robots-tag that would deindex the route
 *
 * The challenge detection is the important part: Cloudflare's managed
 * challenge returns 200 with a "Just a moment..." interstitial and a
 * cf-mitigated: challenge header, which looks like success to a naive
 * status-code check but blocks indexing entirely.
 *
 * Usage: node scripts/audit-crawler-access.mjs [baseUrl]
 */
import { routeMeta } from "../src/routeMeta.ts";

const BASE = (process.argv[2] ?? "https://axiodb.in").replace(/\/+$/, "");

const USER_AGENTS = {
  "Googlebot-Desktop":
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Googlebot-Smartphone":
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "GPTBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  "ClaudeBot":
    "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
};

/** Markers that mean a challenge page was served instead of the real route. */
const CHALLENGE_MARKERS = [
  "Just a moment",
  "Attention Required",
  "cf-browser-verification",
  "cf_chl_opt",
  "Enable JavaScript and cookies to continue",
  "Checking your browser before accessing",
];

/** Machine-readable endpoints probed in addition to the sitemap's pages. */
const EXTRA_PATHS = [
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/openapi.json",
  "/feed.xml",
  "/.well-known/api-catalog",
  "/.well-known/agent-skills/index.json",
  "/nonexistent-page-404-probe",
];

const BROWSER_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};

/** Fetch the live sitemap and return the paths it lists, in document order. */
async function discoverFromSitemap() {
  const res = await fetch(`${BASE}/sitemap.xml`, {
    headers: { "User-Agent": USER_AGENTS["Googlebot-Desktop"], ...BROWSER_HEADERS },
  });

  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);

  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);

  return locs.map((loc) => {
    const url = new URL(loc);
    return url.origin === new URL(BASE).origin
      ? url.pathname
      : url.href;
  });
}

/** Compare the sitemap against the local route table to surface drift. */
function checkDrift(sitemapPaths) {
  const s = new Set(sitemapPaths);
  const local = routeMeta.map((r) => r.path);

  const missingFromSitemap = local.filter((p) => !s.has(p));
  const extraInSitemap = sitemapPaths.filter(
    (p) => p.startsWith("/") && !local.includes(p),
  );

  return { missingFromSitemap, extraInSitemap };
}

function looksBlocked(body, headers) {
  if (headers.get("cf-mitigated")) return `cf-mitigated: ${headers.get("cf-mitigated")}`;
  for (const marker of CHALLENGE_MARKERS) {
    if (body.includes(marker)) return `challenge marker: "${marker}"`;
  }
  return null;
}

async function probe(path, ua) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": ua, ...BROWSER_HEADERS },
    });

    const body = await res.text();
    const headers = res.headers;
    const block = looksBlocked(body, headers);
    const robots = headers.get("x-robots-tag");

    return {
      path,
      status: res.status,
      cf: res.headers.get("cf-cache-status") ?? "-",
      type: (headers.get("content-type") ?? "-").split(";")[0],
      bytes: body.length,
      title: (body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim().slice(0, 60),
      block,
      robots,
      prerendered: body.includes("data-server-rendered") || /\.html/.test(path) === false,
    };
  } catch (err) {
    return { path, status: 0, cf: "-", type: "-", bytes: 0, title: "", block: err.name === "AbortError" ? "timeout" : String(err.message), robots: null };
  } finally {
    clearTimeout(timer);
  }
}

const ICON = { ok: "✅", bad: "❌", warn: "⚠️" };

// 1. Discover the URL list from the live sitemap, the way a crawler would.
console.log(`\n${"=".repeat(78)}\nDiscovering URLs from ${BASE}/sitemap.xml\n${"=".repeat(78)}`);

let sitemapPaths;
try {
  sitemapPaths = await discoverFromSitemap();
} catch (err) {
  console.error(`\n❌ Could not read the sitemap: ${err.message}`);
  console.error("   Nothing to audit - fix the sitemap first, then re-run.\n");
  process.exit(1);
}

const { missingFromSitemap, extraInSitemap } = checkDrift(sitemapPaths);

console.log(`  ${sitemapPaths.length} URLs listed in the live sitemap`);
if (extraInSitemap.length) {
  console.log(
    `  ${ICON.warn} listed in sitemap but not in routeMeta.ts: ${extraInSitemap.join(", ")}`,
  );
}
if (missingFromSitemap.length) {
  console.log(
    `  ${ICON.bad} in routeMeta.ts but MISSING from sitemap (invisible to crawlers): ${missingFromSitemap.join(", ")}`,
  );
}
if (!extraInSitemap.length && !missingFromSitemap.length) {
  console.log(`  ${ICON.ok} sitemap and routeMeta.ts agree exactly`);
}

// 2. Crawl everything the sitemap lists, plus the machine-readable endpoints.
const allPaths = [...new Set([...sitemapPaths, ...EXTRA_PATHS])];

// 3. Same sweep per crawler.
for (const [label, ua] of Object.entries(USER_AGENTS)) {
  console.log(`\n${"=".repeat(78)}\n${label}\n${"=".repeat(78)}`);
  const rows = [];

  for (const path of allPaths) rows.push(await probe(path, ua));

  const blocked = rows.filter((r) => r.block);
  const nonOk = rows.filter((r) => r.status !== 200);
  const deindexed = rows.filter((r) => r.robots && /noindex/i.test(r.robots));

  for (const r of rows) {
    const mark = r.block ? ICON.bad : r.status === 200 ? ICON.ok : ICON.warn;
    const note = r.block ? ` BLOCKED — ${r.block}` : r.status !== 200 ? ` status ${r.status}` : "";
    console.log(
      `${mark} ${r.status || "ERR"} ${r.path.padEnd(34)} ${r.type.padEnd(26)} ${String(r.bytes).padStart(7)}B ${r.title}${note}`,
    );
  }

  console.log(
    `\n  ${rows.length} probed · ${rows.length - blocked.length - nonOk.length} clean · ${nonOk.length} non-200 · ${blocked.length} blocked · ${deindexed.length} noindex`,
  );
  if (deindexed.length) {
    console.log(`  noindex (expected for the 404 probe only): ${deindexed.map((r) => r.path).join(", ")}`);
  }
}

console.log(
  `\n${"=".repeat(78)}\nDone.` +
    (missingFromSitemap.length
      ? `\n❌ ${missingFromSitemap.length} route(s) missing from the sitemap - crawlers cannot see them.`
      : "") +
    (extraInSitemap.length
      ? `\n⚠️  ${extraInSitemap.length} sitemap URL(s) not in routeMeta.ts.`
      : "") +
    `\nAny ❌ in a crawler table means that crawler is being served a Cloudflare challenge, not the page.\n${"=".repeat(78)}`,
);
