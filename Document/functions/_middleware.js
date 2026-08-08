/**
 * Content negotiation for AI agents (Cloudflare Pages Function).
 *
 * A request for a page with `Accept: text/markdown` gets the Markdown twin
 * that scripts/generate-markdown.ts emitted next to the prerendered HTML
 * (/features -> /features.md). Everything else falls through untouched, with
 * `Vary: Accept` added to HTML responses so caches don't serve one
 * representation to a client that asked for the other.
 *
 * Written in plain JS on purpose: no build step and no @cloudflare/workers-types
 * dependency for ~40 lines of edge glue.
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

  const html = await next();
  const response = new Response(html.body, html);
  response.headers.append("Vary", "Accept");
  return response;
}
