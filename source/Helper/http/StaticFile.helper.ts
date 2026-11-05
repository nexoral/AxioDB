import fs from "fs";
import path from "path";
import { AxioHttpRequest, AxioHttpResponse } from "./HttpTypes";

export default class StaticFileHelper {
  private static readonly MIME_TYPES: Record<string, string> = {
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

  public static resolveWithinRoot(root: string, urlPath: string): string | null {
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

  public static async serve(root: string, request: AxioHttpRequest, reply: AxioHttpResponse): Promise<boolean> {
    if (request.method !== "GET" && request.method !== "HEAD") return false;
    if (request.path.startsWith("/api")) return false;

    let target = StaticFileHelper.resolveWithinRoot(root, request.path);
    if (!target) return false;

    let stats: fs.Stats;
    try {
      stats = await fs.promises.stat(target);
      if (stats.isDirectory()) {
        const indexTarget = path.join(target, "index.html");
        stats = await fs.promises.stat(indexTarget);
        target = indexTarget;
      }
    } catch {
      return false;
    }

    if (!stats.isFile()) return false;

    const ext = path.extname(target).toLowerCase();
    const contentType = StaticFileHelper.MIME_TYPES[ext] ?? "application/octet-stream";
    reply.type(contentType);
    reply.header("Content-Length", stats.size);

    if (request.method === "HEAD") {
      reply.status(200).send();
      return true;
    }

    const stream = fs.createReadStream(target);
    reply.status(200).send(stream);
    return true;
  }
}
