import { useEffect } from "react";
import { routeMeta } from "../routeMeta";

/**
 * Registers this documentation site's tools with the browser's WebMCP API
 * (https://webmachinelearning.github.io/webmcp/), so a browser-resident agent
 * can search and read the docs directly instead of scraping the rendered page.
 *
 * Reads the same Markdown twins the Pages middleware serves under
 * `Accept: text/markdown`, so there is no third copy of the content to keep in
 * sync. A no-op in browsers without `navigator.modelContext`.
 */

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, string>) => Promise<{ content: { type: "text"; text: string }[] }>;
}

interface ModelContext {
  registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => unknown;
}

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

/** Fetches a route's Markdown twin (`/usage` -> `/usage.md`). */
async function fetchPageMarkdown(path: string): Promise<string> {
  const normalized = path.startsWith("/") ? path.replace(/\/+$/, "") : `/${path}`;
  const response = await fetch(normalized === "" ? "/index.md" : `${normalized}.md`);
  if (!response.ok) throw new Error(`No documentation page at "${path}"`);
  return response.text();
}

export function useWebMcp(): void {
  useEffect(() => {
    const modelContext = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    const pageList = routeMeta.map(({ path, label }) => `- ${path} — ${label}`).join("\n");

    modelContext.registerTool(
      {
        name: "axiodb_list_docs",
        description:
          "List every AxioDB documentation page on this site with its path and title. Call this first to find the page to read.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => text(pageList),
      },
      { signal: controller.signal },
    );

    modelContext.registerTool(
      {
        name: "axiodb_read_doc",
        description:
          "Read a full AxioDB documentation page as Markdown. Use a path from axiodb_list_docs, for example \"/usage\" or \"/api-reference\".",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: 'Documentation route, e.g. "/transactions" or "/usage"' },
          },
          required: ["path"],
          additionalProperties: false,
        },
        execute: async ({ path }) => {
          try {
            return text(await fetchPageMarkdown(path));
          } catch (error) {
            return text(`${(error as Error).message}\n\nAvailable pages:\n${pageList}`);
          }
        },
      },
      { signal: controller.signal },
    );

    modelContext.registerTool(
      {
        name: "axiodb_search_docs",
        description:
          "Search the complete AxioDB documentation for a term (API name, option, error message) and return the matching sections.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: 'Term to search for, e.g. "insertMany" or "TLSCertPath"' },
          },
          required: ["query"],
          additionalProperties: false,
        },
        execute: async ({ query }) => {
          const response = await fetch("/llms-full.txt");
          if (!response.ok) return text("Documentation corpus is unavailable right now.");

          const needle = query.toLowerCase();
          // llms-full.txt is one document split by "## " headings; return whole
          // sections so the agent gets code samples with their surrounding prose.
          const sections = (await response.text())
            .split(/\n(?=## )/)
            .filter((section) => section.toLowerCase().includes(needle));

          return text(
            sections.length === 0
              ? `No AxioDB documentation matches "${query}".`
              : sections.slice(0, 5).join("\n\n---\n\n"),
          );
        },
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, []);
}
