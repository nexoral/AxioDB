/**
 * Regenerates every machine-readable file served out of public/ from the two
 * in-repo sources of truth, so they can't silently drift out of sync with the
 * site again. Runs automatically before each build (package.json "prebuild").
 *
 * From src/routeMeta.ts (the real router):
 *   - sitemap.xml
 *   - the "## Documentation Pages" section of llms.txt
 *
 * From src/data/serverApi.ts (the /server-api page's endpoint list):
 *   - openapi.json                  OpenAPI 3.1 description of the HTTP Control Server
 *   - .well-known/api-catalog       RFC 9727 linkset pointing at it
 *
 * Plus .well-known/agent-skills/index.json, whose SHA-256 digest has to be
 * recomputed whenever the hand-written SKILL.md next to it changes.
 */
import { createHash } from "node:crypto";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { routeMeta } from "../src/routeMeta.ts";
import { apiCategories } from "../src/data/serverApi.ts";
import type { ApiEndpoint } from "../src/data/serverApi.ts";

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

/** Endpoints the AxioDB server serves without a session cookie. */
const PUBLIC_ENDPOINTS = new Set([
  "GET /api/info",
  "GET /api/health",
  "GET /api/routes",
  "POST /api/auth/login",
]);

/** Maps the doc page's loose `dataType` strings onto JSON Schema types. */
function toSchema(dataType: string): Record<string, unknown> {
  const type = dataType.trim().toLowerCase();
  if (type.endsWith("[]") || type.startsWith("array")) return { type: "array", items: {} };
  if (["number", "integer", "boolean", "object", "string"].includes(type)) return { type };
  return { type: "string", description: `Documented as \`${dataType}\`` };
}

/**
 * Response/request examples in the docs are illustrative snippets - most are
 * JSON, a few are prose (e.g. a binary download). Parse what parses and keep
 * the rest as a literal string; OpenAPI `example` accepts either.
 */
function toExample(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function buildOperation(endpoint: ApiEndpoint): Record<string, unknown> {
  const params = (endpoint.parameters ?? []).filter((p) => p.type !== "body");
  const bodyParams = (endpoint.parameters ?? []).filter((p) => p.type === "body");

  const responses: Record<string, unknown> = {};
  for (const { code, description } of endpoint.statusCodes) {
    const isSuccess = code >= 200 && code < 300;
    responses[String(code)] = {
      description,
      ...(isSuccess && endpoint.responseExample
        ? { content: { "application/json": { example: toExample(endpoint.responseExample) } } }
        : {}),
    };
  }

  const bodySchema =
    bodyParams.length > 0
      ? {
          type: "object",
          properties: Object.fromEntries(
            bodyParams.map((p) => [p.name, { ...toSchema(p.dataType), description: p.description }]),
          ),
          required: bodyParams.filter((p) => p.required).map((p) => p.name),
        }
      : { type: "object" };

  return {
    summary: endpoint.description.split(". ")[0],
    description: endpoint.description,
    operationId: `${endpoint.method.toLowerCase()}${endpoint.path
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "")}`,
    parameters: params.map((p) => ({
      name: p.name,
      in: p.type === "header" ? "header" : "query",
      required: p.required,
      description: p.description,
      schema: toSchema(p.dataType),
    })),
    ...(endpoint.method === "GET" || endpoint.method === "DELETE"
      ? {}
      : {
          requestBody: {
            required: bodyParams.some((p) => p.required) || Boolean(endpoint.requestBody),
            content: {
              "application/json": {
                schema: bodySchema,
                ...(endpoint.requestBody ? { example: toExample(endpoint.requestBody) } : {}),
              },
            },
          },
        }),
    responses,
    security: PUBLIC_ENDPOINTS.has(`${endpoint.method} ${endpoint.path}`) ? [] : [{ sessionCookie: [] }],
  };
}

function buildOpenApi(): string {
  const paths: Record<string, Record<string, unknown>> = {};
  const pathParams: Record<string, unknown[]> = {};

  for (const category of apiCategories) {
    for (const endpoint of category.endpoints) {
      // ":username" in the docs is OpenAPI's "{username}".
      const names: string[] = [];
      const templated = endpoint.path.replace(/:([a-zA-Z0-9_]+)/g, (_, name: string) => {
        names.push(name);
        return `{${name}}`;
      });

      pathParams[templated] = names.map((name) => ({
        name,
        in: "path",
        required: true,
        schema: { type: "string" },
      }));

      paths[templated] ??= {};
      paths[templated][endpoint.method.toLowerCase()] = {
        tags: [category.title],
        ...buildOperation(endpoint),
      };
    }
  }

  for (const [path, params] of Object.entries(pathParams)) {
    if (params.length > 0) paths[path].parameters = params;
  }

  return `${JSON.stringify(
    {
      openapi: "3.1.0",
      info: {
        title: "AxioDB Dashboard HTTP API (Control Server)",
        description: [
          "REST API behind the AxioDB Dashboard - the web GUI AxioDB starts on port 27018 - for managing databases, collections, indexes, documents, users, and roles.",
          "",
          "This is not a hosted service. It runs inside your own AxioDB process: enable it with `new AxioDB({ GUI: true })`, or with `AXIODB_GUI=true` on the `theankansaha/axiodb` Docker image. https://axiodb.in serves documentation only.",
          "",
          "This API is one of several AxioDB surfaces and is not interchangeable with the others:",
          "- Embedded library (`npm install axiodb`) - in-process, no HTTP at all. https://axiodb.in/api-reference",
          "- AxioDBCloud TCP server/client on port 27019 - its own wire protocol, not HTTP. https://axiodb.in/cloud",
          "- MCP server on port 27020 (Docker image only) - Streamable HTTP at /mcp, 32 tools. https://axiodb.in/mcp-server",
          "",
          "The Dashboard, AxioDBCloud authentication, and the MCP server share one user and role store.",
          "",
          "Human-readable reference: https://axiodb.in/server-api",
        ].join("\n"),
        version: "1.0.0",
        license: { name: "MIT", identifier: "MIT" },
        contact: { name: "AxioDB", url: SITE_URL },
      },
      servers: [
        {
          url: "http://localhost:27018",
          description: "AxioDB Dashboard on the machine running AxioDB (port is fixed; remap at the Docker layer if needed)",
        },
      ],
      tags: apiCategories.map(({ title, description }) => ({ name: title, description })),
      paths,
      components: {
        securitySchemes: {
          sessionCookie: {
            type: "apiKey",
            in: "cookie",
            name: "axiodb_session",
            description: "httpOnly session cookie issued by POST /api/auth/login. RBAC-enforced per endpoint.",
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

/** RFC 9727 API catalogue - one linkset entry per described API. */
function buildApiCatalog(): string {
  return `${JSON.stringify(
    {
      linkset: [
        {
          // The API itself is self-hosted (localhost:27018), so its stable
          // public identifier is its documentation page, not a URL on this site.
          anchor: `${SITE_URL}/server-api`,
          "service-desc": [{ href: `${SITE_URL}/openapi.json`, type: "application/json" }],
          "service-doc": [{ href: `${SITE_URL}/server-api`, type: "text/html" }],
          "service-meta": [{ href: `${SITE_URL}/llms.txt`, type: "text/plain" }],
          // No "status" link: the health endpoint (GET /api/health) lives on
          // whichever host runs AxioDB, not on this documentation site.
        },
      ],
    },
    null,
    2,
  )}\n`;
}

/**
 * Agent Skills Discovery index (v0.2.0). The digest must match the SKILL.md
 * byte-for-byte, which is exactly why this file is generated rather than
 * hand-maintained.
 */
function buildAgentSkillsIndex(skillMd: string): string {
  return `${JSON.stringify(
    {
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: [
        {
          name: "axiodb",
          type: "skill-md",
          description:
            "Use AxioDB, an embedded NoSQL database for Node.js with MongoDB-style queries and zero native dependencies.",
          url: `${SITE_URL}/.well-known/agent-skills/axiodb/SKILL.md`,
          digest: `sha256:${createHash("sha256").update(skillMd).digest("hex")}`,
          license: "MIT",
          homepage: SITE_URL,
        },
      ],
    },
    null,
    2,
  )}\n`;
}

const publicDir = resolve(__dirname, "../public");
const wellKnownDir = resolve(publicDir, ".well-known");

writeFileSync(resolve(publicDir, "sitemap.xml"), buildSitemap());
updateLlmsTxt(resolve(publicDir, "llms.txt"));
writeFileSync(resolve(publicDir, "openapi.json"), buildOpenApi());
writeFileSync(resolve(wellKnownDir, "api-catalog"), buildApiCatalog());
writeFileSync(
  resolve(wellKnownDir, "agent-skills/index.json"),
  buildAgentSkillsIndex(readFileSync(resolve(wellKnownDir, "agent-skills/axiodb/SKILL.md"), "utf-8")),
);

const endpointCount = apiCategories.reduce((n, c) => n + c.endpoints.length, 0);
console.log(
  `[generate-seo-files] sitemap.xml + llms.txt for ${routeMeta.length} routes; ` +
    `openapi.json + api-catalog for ${endpointCount} endpoints; agent-skills index.`,
);
