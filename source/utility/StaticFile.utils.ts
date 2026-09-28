import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";

/**
 * Static file serving for the control server.
 *
 * The job was never just "read a file" - it was mapping a request path to a file
 * inside a fixed root without ever escaping it. That containment is the part
 * worth keeping explicit, so it is written out here rather than left implicit:
 * every candidate path is resolved and compared against the root, and the
 * `onRequest` dot-dot guard in `config/server.ts` is a second layer in front.
 */

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
};

function contentTypeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Maps a URL path to a file inside `root`, or returns null when the result would
 * escape it. Any traversal sequence resolves outside `root` and is rejected here.
 */
export function resolveWithinRoot(root: string, urlPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const candidate = path.resolve(root, `.${path.posix.normalize(`/${decoded}`)}`);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (candidate !== root && !candidate.startsWith(rootWithSep)) {
    return null;
  }
  return candidate;
}

export interface StaticOptions {
  root: string;
}

/**
 * Serves files from `root` for GET/HEAD requests that no route has claimed.
 * Registered as an `onRequest` hook rather than a wildcard route so it composes
 * with the existing router instead of competing with it.
 */
export default function registerStatic(fastify: FastifyInstance, options: StaticOptions): void {
  const root = path.resolve(options.root);

  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return;
    }
    // A reply already sent means a route or an earlier hook claimed the request.
    if (reply.sent) {
      return;
    }

    const urlPath = (request.raw.url ?? "/").split("?", 1)[0];
    const target = resolveWithinRoot(root, urlPath);
    if (target === null) {
      return;
    }

    let stats: fs.Stats;
    try {
      stats = await fs.promises.stat(target);
    } catch {
      return;
    }
    // Directories fall through so the app can serve its own index route.
    if (!stats.isFile()) {
      return;
    }

    const type = contentTypeFor(target);
    reply.header("Content-Type", type);
    reply.header("Content-Length", String(stats.size));

    if (request.method === "HEAD") {
      await reply.code(200).send();
      return;
    }

    await reply.type(type).send(fs.createReadStream(target));
  });
}
