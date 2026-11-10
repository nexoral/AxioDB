import {
  AxioHttpRequest,
  AxioHttpResponse,
  RouteHandler,
  RouteOptions,
} from "./HttpTypes";

interface RouteRecord {
  method: string;
  path: string;
  segments: string[];
  paramNames: string[];
  isParametric: boolean;
  options: RouteOptions;
  handler: RouteHandler;
}

export default class HttpRouter {
  private routes: RouteRecord[] = [];
  private notFoundHandler?: RouteHandler;

  constructor(private prefix: string = "") {}

  public get(path: string, optionsOrHandler: RouteOptions | RouteHandler, maybeHandler?: RouteHandler): void {
    this.addRoute("GET", path, optionsOrHandler, maybeHandler);
  }

  public post(path: string, optionsOrHandler: RouteOptions | RouteHandler, maybeHandler?: RouteHandler): void {
    this.addRoute("POST", path, optionsOrHandler, maybeHandler);
  }

  public put(path: string, optionsOrHandler: RouteOptions | RouteHandler, maybeHandler?: RouteHandler): void {
    this.addRoute("PUT", path, optionsOrHandler, maybeHandler);
  }

  public patch(path: string, optionsOrHandler: RouteOptions | RouteHandler, maybeHandler?: RouteHandler): void {
    this.addRoute("PATCH", path, optionsOrHandler, maybeHandler);
  }

  public delete(path: string, optionsOrHandler: RouteOptions | RouteHandler, maybeHandler?: RouteHandler): void {
    this.addRoute("DELETE", path, optionsOrHandler, maybeHandler);
  }

  public setNotFoundHandler(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }

  public async register<T = unknown>(
    plugin: (router: HttpRouter, options: T) => Promise<void> | void,
    options?: T & { prefix?: string },
  ): Promise<void> {
    const prefixOpt = options && typeof options === "object" && "prefix" in options ? (options as { prefix?: string }).prefix : "";
    const subPrefix = this.normalizePath(`${this.prefix}${prefixOpt ?? ""}`);
    const subRouter = new HttpRouter(subPrefix);
    await plugin(subRouter, (options ?? {}) as T);
    this.routes.push(...subRouter.routes);
    if (!this.notFoundHandler && subRouter.notFoundHandler) {
      this.notFoundHandler = subRouter.notFoundHandler;
    }
  }

  public async handle(request: AxioHttpRequest, reply: AxioHttpResponse): Promise<boolean> {
    const match = this.matchRoute(request.method, request.path);
    if (!match) {
      if (this.notFoundHandler) {
        await this.notFoundHandler(request, reply);
        return true;
      }
      return false;
    }

    request.params = match.params;

    if (match.route.options.preHandler) {
      for (const middleware of match.route.options.preHandler) {
        await middleware(request, reply);
        if (reply.sent || reply.raw.writableEnded) {
          return true;
        }
      }
    }

    const result = await match.route.handler(request, reply);
    if (!reply.sent && !reply.raw.writableEnded && result !== undefined) {
      if (
        result !== null &&
        typeof result === "object" &&
        "statusCode" in result &&
        typeof (result as { statusCode: unknown }).statusCode === "number"
      ) {
        reply.status((result as { statusCode: number }).statusCode);
      }
      await reply.send(result);
    }

    return true;
  }

  private addRoute(
    method: string,
    routePath: string,
    optionsOrHandler: RouteOptions | RouteHandler,
    maybeHandler?: RouteHandler,
  ): void {
    const options: RouteOptions = typeof optionsOrHandler === "function" ? {} : optionsOrHandler;
    const handler: RouteHandler = typeof optionsOrHandler === "function" ? optionsOrHandler : maybeHandler!;
    const fullPath = this.normalizePath(`${this.prefix}${routePath}`);

    const segments = fullPath.split("/").filter(Boolean);
    const paramNames: string[] = [];
    let isParametric = false;

    for (const seg of segments) {
      if (seg.startsWith(":")) {
        isParametric = true;
        paramNames.push(seg.slice(1));
      } else {
        paramNames.push("");
      }
    }

    this.routes.push({
      method,
      path: fullPath,
      segments,
      paramNames,
      isParametric,
      options,
      handler,
    });
  }

  private matchRoute(method: string, requestPath: string): { route: RouteRecord; params: Record<string, string> } | null {
    const normalized = this.normalizePath(requestPath);
    const reqSegments = normalized.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (route.method !== method) continue;

      if (!route.isParametric) {
        if (route.path === normalized) {
          return { route, params: {} };
        }
        continue;
      }

      if (route.segments.length !== reqSegments.length) continue;

      const params: Record<string, string> = {};
      let matched = true;

      for (let i = 0; i < route.segments.length; i++) {
        if (route.paramNames[i]) {
          params[route.paramNames[i]] = decodeURIComponent(reqSegments[i]);
        } else if (route.segments[i] !== reqSegments[i]) {
          matched = false;
          break;
        }
      }

      if (matched) {
        return { route, params };
      }
    }

    return null;
  }

  private normalizePath(p: string): string {
    const normalized = p.replace(/\/+/g, "/");
    if (normalized.length > 1 && normalized.endsWith("/")) {
      return normalized.slice(0, -1);
    }
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }
}
