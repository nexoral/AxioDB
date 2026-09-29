/**
 * Content negotiation + real-404 for AI agents (Cloudflare Pages Function).
 *
 * A request for a page with `Accept: text/markdown` gets the Markdown twin
 * that scripts/generate-markdown.ts emitted next to the prerendered HTML
 * (/features -> /features.md). Everything else falls through untouched, with
 * `Vary: Accept` added to HTML responses so caches don't serve one
 * representation to a client that asked for the other.
 *
 * Also converts the SPA's soft-404 into a real one. wrangler.toml rewrites
 * every unmatched path to /index.html with status 200, which makes a typo'd or
 * retired URL answer 200 with the homepage body - Google indexes those as
 * duplicates and spends crawl budget on them. When the request is for an
 * extension-less path and no prerendered file exists for it, serve 404.html
 * (built by the vite-react-ssg catch-all route) with a 404 status instead.
 *
 * Written in plain JS on purpose: no build step and no @cloudflare/workers-types
 * dependency for ~60 lines of edge glue.
 */

const wantsMarkdown = (accept) => /(^|,|\s)text\/markdown\b/i.test(accept);

/** Rough 4-chars-per-token estimate, advertised via x-markdown-tokens. */
const estimateTokens = (text) => Math.ceil(text.length / 4);

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  // Only pages negotiate; .json/.txt/.md/assets are served as-is so they stay
  // cacheable without a Vary on every response.
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return next();

  if (wantsMarkdown(request.headers.get("accept") ?? "")) {
    const path = url.pathname.replace(/\/+$/, "");
    const asset = await env.ASSETS.fetch(new URL(path === "" ? "/index.md" : `${path}.md`, url));

    if (asset.ok) {
      const markdown = await asset.text();
      return new Response(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Language": "en",
          Vary: "Accept",
          "Cache-Control": "public, max-age=3600",
          "x-markdown-tokens": String(estimateTokens(markdown)),
          Link: `<${url.origin}${url.pathname}>; rel="canonical"; type="text/html"`,
        },
      });
    }
    // No Markdown twin for this route - fall through to HTML rather than 404.
  }

  // Real 404: a route with no prerendered HTML behind it. The ASSETS fetch
  // bypasses the SPA rewrite, so it 404s where a normal request would get the
  // homepage shell back.
  const page = url.pathname.replace(/\/+$/, "");
  const prerendered = await env.ASSETS.fetch(
    new URL(page === "" ? "/index.html" : `${page}.html`, url),
  );

  if (!prerendered.ok) {
    const notFound = await env.ASSETS.fetch(new URL("/404.html", url));
    const body = notFound.ok
      ? await notFound.text()
      : "<!doctype html><title>404</title><h1>404 Not Found</h1>";

    return new Response(body, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600",
        "X-Robots-Tag": "noindex, follow",
      },
    });
  }

  const html = await next();
  const response = new Response(html.body, html);
  response.headers.append("Vary", "Accept");
  return response;
}
