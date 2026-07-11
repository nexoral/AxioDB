export interface RouteMeta {
  /** Full route path, starting with "/" (e.g. "/api-reference"). */
  path: string;
  /** Human-readable label, used for sitemap/llms.txt generation. */
  label: string;
}

/**
 * Single source of truth for every real, canonical documentation route -
 * consumed by App.tsx (to build the route table) and by
 * scripts/generate-seo-files.mjs (to generate sitemap.xml and llms.txt's page
 * list) so the two can never drift out of sync again.
 *
 * Deliberately excludes "/why-choose-axiodb": it renders the same Introduction
 * component as "/" and its <Seo> canonical already points back to "/", so it's
 * a legacy alias, not a distinct indexable page.
 */
export const routeMeta: RouteMeta[] = [
  { path: "/", label: "Introduction" },
  { path: "/features", label: "Features" },
  { path: "/limitations", label: "Limitations & Scale Considerations" },
  { path: "/installation", label: "Installation" },
  { path: "/usage", label: "Basic Usage & Operations" },
  { path: "/advanced-features", label: "Advanced Features" },
  { path: "/api-reference", label: "API Reference" },
  { path: "/server-api", label: "Server API (HTTP)" },
  { path: "/security", label: "Security & Access Control" },
  { path: "/community", label: "Community" },
  { path: "/comparison", label: "Performance Comparison" },
  { path: "/create-database", label: "Create Database" },
  { path: "/create-collection", label: "Create Collection" },
  { path: "/cloud", label: "AxioDBCloud (Remote/TCP)" },
  { path: "/docker", label: "Docker Deployment" },
  { path: "/mcp-server", label: "MCP Server (AI Agent Integration)" },
  { path: "/troubleshooting", label: "Troubleshooting" },
  { path: "/changelog", label: "Changelog" },
  { path: "/maintainers-zone", label: "Maintainer's Zone" },
];
