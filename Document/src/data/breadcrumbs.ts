export interface BreadcrumbItem {
  name: string;
  path: string;
}

const SITE_URL = "https://axiodb.in";

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  "/": [{ name: "Home", path: "/" }],
  "/features": [{ name: "Home", path: "/" }, { name: "Features", path: "/features" }],
  "/limitations": [{ name: "Home", path: "/" }, { name: "Limitations", path: "/limitations" }],
  "/installation": [{ name: "Home", path: "/" }, { name: "Installation", path: "/installation" }],
  "/usage": [{ name: "Home", path: "/" }, { name: "Usage", path: "/usage" }],
  "/advanced-features": [{ name: "Home", path: "/" }, { name: "Advanced Features", path: "/advanced-features" }],
  "/api-reference": [{ name: "Home", path: "/" }, { name: "API Reference", path: "/api-reference" }, { name: "SDK API", path: "/api-reference" }],
  "/server-api": [{ name: "Home", path: "/" }, { name: "API Reference", path: "/api-reference" }, { name: "Server API", path: "/server-api" }],
  "/security": [{ name: "Home", path: "/" }, { name: "Security", path: "/security" }],
  "/community": [{ name: "Home", path: "/" }, { name: "Community", path: "/community" }],
  "/comparison": [{ name: "Home", path: "/" }, { name: "Comparison", path: "/comparison" }],
  "/create-database": [{ name: "Home", path: "/" }, { name: "Create Database", path: "/create-database" }],
  "/create-collection": [{ name: "Home", path: "/" }, { name: "Create Collection", path: "/create-collection" }],
  "/cloud": [{ name: "Home", path: "/" }, { name: "AxioDBCloud", path: "/cloud" }],
  "/cli": [{ name: "Home", path: "/" }, { name: "CLI", path: "/cli" }],
  "/gui": [{ name: "Home", path: "/" }, { name: "Desktop GUI", path: "/gui" }],
  "/docker": [{ name: "Home", path: "/" }, { name: "Docker", path: "/docker" }],
  "/mcp-server": [{ name: "Home", path: "/" }, { name: "MCP Server", path: "/mcp-server" }],
  "/troubleshooting": [{ name: "Home", path: "/" }, { name: "Troubleshooting", path: "/troubleshooting" }],
  "/changelog": [{ name: "Home", path: "/" }, { name: "Changelog", path: "/changelog" }],
  "/performance": [{ name: "Home", path: "/" }, { name: "Performance", path: "/performance" }],
  "/maintainers-zone": [{ name: "Home", path: "/" }, { name: "Maintainer's Zone", path: "/maintainers-zone" }],
};

export function getBreadcrumbs(path: string): BreadcrumbItem[] {
  return breadcrumbMap[path] ?? [{ name: "Home", path: "/" }];
}

export function getBreadcrumbSchema(path: string): object {
  const items = getBreadcrumbs(path);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": `${SITE_URL}${item.path}`,
    })),
  };
}