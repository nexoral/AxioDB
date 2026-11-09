import http, { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import { SECURITY_HEADERS } from "../../server/config/keys";
import CookieHelper from "./Cookie.helper";
import CorsHelper from "./Cors.helper";
import HttpRouter from "./HttpRouter.helper";
import {
  AxioHttpRequest,
  AxioHttpResponse,
  CookieSerializeOptions,
} from "./HttpTypes";
import MultipartHelper from "./Multipart.helper";
import SafeErrorMessage from "../SafeErrorMessage.helper";

export interface HttpServerOptions {
  bodyLimit?: number;
}

export default class HttpServerHelper {
  private server: http.Server;
  private router: HttpRouter;
  private bodyLimit: number;

  constructor(router: HttpRouter, options: HttpServerOptions = {}) {
    this.router = router;
    this.bodyLimit = options.bodyLimit ?? 52428800; // 50MB

    this.server = http.createServer(this.handleRequest.bind(this));
  }

  public async listen(port: number, host: string = "0.0.0.0"): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(port, host, () => {
        this.server.removeListener("error", reject);
        resolve();
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const rawUrl = req.url ?? "/";
    const rawPath = rawUrl.split("?", 1)[0];
    const parsedUrl = new URL(rawUrl, "http://127.0.0.1");
    const path = parsedUrl.pathname;

    const request: AxioHttpRequest = {
      method: (req.method ?? "GET").toUpperCase(),
      url: rawUrl,
      path,
      ip:
        (typeof req.headers["x-forwarded-for"] === "string"
          ? req.headers["x-forwarded-for"].split(",")[0].trim()
          : undefined) ||
        (typeof req.headers["x-real-ip"] === "string"
          ? req.headers["x-real-ip"].trim()
          : undefined) ||
        req.socket.remoteAddress ||
        "127.0.0.1",
      query: Object.fromEntries(parsedUrl.searchParams),
      params: {},
      headers: req.headers,
      body: undefined,
      cookies: CookieHelper.parse(req.headers.cookie ?? ""),
      raw: req,
      file: async () => {
        const contentType = req.headers["content-type"];
        const boundary = MultipartHelper.getBoundary(contentType);
        return boundary ? MultipartHelper.parseFile(req, boundary) : null;
      },
    };

    let statusCode = 200;
    const responseHeaders: Record<string, string | number | string[]> = {};
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      responseHeaders[key] = value;
    }

    const reply: AxioHttpResponse = {
      raw: res,
      sent: false,
      status(code: number) {
        statusCode = code;
        return this;
      },
      code(code: number) {
        return this.status(code);
      },
      header(name: string, value: string | number) {
        responseHeaders[name] = value;
        return this;
      },
      type(contentType: string) {
        responseHeaders["Content-Type"] = contentType;
        return this;
      },
      setCookie(name: string, value: string, options?: CookieSerializeOptions) {
        const serialized = CookieHelper.serialize(name, value, options);
        const existing = responseHeaders["Set-Cookie"];
        if (Array.isArray(existing)) {
          existing.push(serialized);
        } else if (typeof existing === "string") {
          responseHeaders["Set-Cookie"] = [existing, serialized];
        } else {
          responseHeaders["Set-Cookie"] = serialized;
        }
        return this;
      },
      clearCookie(name: string, options?: CookieSerializeOptions) {
        return this.setCookie(name, "", { ...options, maxAge: 0, expires: new Date(0) });
      },
      send(data?: unknown) {
        if (this.sent || res.writableEnded) return;
        this.sent = true;

        if (data instanceof Readable) {
          for (const [k, v] of Object.entries(responseHeaders)) {
            res.setHeader(k, v);
          }
          res.writeHead(statusCode);
          data.pipe(res);
          return;
        }

        if (Buffer.isBuffer(data)) {
          if (!responseHeaders["Content-Type"]) {
            responseHeaders["Content-Type"] = "application/octet-stream";
          }
          responseHeaders["Content-Length"] = data.length;
          for (const [k, v] of Object.entries(responseHeaders)) {
            res.setHeader(k, v);
          }
          res.writeHead(statusCode);
          res.end(data);
          return;
        }

        if (typeof data === "string") {
          if (!responseHeaders["Content-Type"]) {
            responseHeaders["Content-Type"] = "text/plain; charset=utf-8";
          }
          const buf = Buffer.from(data, "utf8");
          responseHeaders["Content-Length"] = buf.length;
          for (const [k, v] of Object.entries(responseHeaders)) {
            res.setHeader(k, v);
          }
          res.writeHead(statusCode);
          res.end(buf);
          return;
        }

        if (data === undefined || data === null) {
          for (const [k, v] of Object.entries(responseHeaders)) {
            res.setHeader(k, v);
          }
          res.writeHead(statusCode);
          res.end();
          return;
        }

        const json = JSON.stringify(data);
        const buf = Buffer.from(json, "utf8");
        responseHeaders["Content-Type"] = "application/json; charset=utf-8";
        responseHeaders["Content-Length"] = buf.length;
        for (const [k, v] of Object.entries(responseHeaders)) {
          res.setHeader(k, v);
        }
        res.writeHead(statusCode);
        res.end(buf);
      },
    };

    try {
      if (/(?:^|\/)(?:\.\.|%2e%2e)(?:\/|$)/i.test(rawPath)) {
        reply.status(400).send({
          statusCode: 400,
          status: false,
          message: "Invalid request path",
        });
        return;
      }

      if (CorsHelper.handle(request, reply)) {
        return;
      }

      const contentType = req.headers["content-type"] ?? "";
      if (
        (request.method === "POST" || request.method === "PUT" || request.method === "PATCH" || request.method === "DELETE") &&
        !contentType.toLowerCase().startsWith("multipart/form-data")
      ) {
        request.body = await this.parseRequestBody(req);
      }

      const handled = await this.router.handle(request, reply);
      if (!handled && !reply.sent && !res.writableEnded) {
        reply.status(404).send({
          statusCode: 404,
          status: false,
          message: `Route ${request.method}:${request.path} not found`,
        });
      }
    } catch (error) {
      if (!reply.sent && !res.writableEnded) {
        reply.status(500).send({
          statusCode: 500,
          status: false,
          message: SafeErrorMessage.sanitize(error),
        });
      }
    }
  }

  private async parseRequestBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalLength = 0;

      req.on("data", (chunk: Buffer) => {
        totalLength += chunk.length;
        if (totalLength > this.bodyLimit) {
          req.destroy(new Error("Request body exceeds limit"));
          return;
        }
        chunks.push(chunk);
      });

      req.on("end", () => {
        if (chunks.length === 0) {
          resolve(undefined);
          return;
        }
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        if (!raw) {
          resolve(undefined);
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(raw);
        }
      });

      req.on("error", reject);
    });
  }
}
