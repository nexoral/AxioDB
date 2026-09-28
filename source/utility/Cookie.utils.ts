import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Cookie support for the control server.
 *
 * Sessions are server-side: the cookie carries only a `sid` that must match an
 * entry in `SessionStore`, so the value itself needs no integrity protection.
 * What this has to get right is correct parsing - a mis-split cookie would
 * silently drop a valid session or authenticate the wrong one.
 */

const COOKIE_PAIR = /; */;

export interface CookieSerializeOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean | "auto";
  sameSite?: "lax" | "strict" | "none" | boolean;
}

function decode(value: string): string {
  if (!value.includes("%") && !value.includes("+")) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    // A malformed escape must not fail the whole request - hand back the raw
    // value so it simply misses the session lookup instead.
    return value;
  }
}

export function parseCookieHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(COOKIE_PAIR)) {
    const index = pair.indexOf("=");
    if (index < 0) {
      continue;
    }
    const name = pair.slice(0, index).trim();
    // First occurrence wins, matching how browsers and the plugin behave.
    if (name.length === 0 || name in result) {
      continue;
    }
    result[name] = decode(pair.slice(index + 1).trim());
  }
  return result;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {},
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  }
  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }
  cookie += `; Path=${options.path ?? "/"}`;
  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }
  if (options.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (options.secure) {
    cookie += "; Secure";
  }
  if (options.sameSite && options.sameSite !== true) {
    const mode = String(options.sameSite);
    cookie += `; SameSite=${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
  }

  return cookie;
}

declare module "fastify" {
  interface FastifyRequest {
    cookies: Record<string, string>;
  }
  interface FastifyReply {
    setCookie(name: string, value: string, options?: CookieSerializeOptions): FastifyReply;
    clearCookie(name: string, options?: Pick<CookieSerializeOptions, "path" | "domain">): FastifyReply;
  }
}

/**
 * Populates `request.cookies` and attaches the `setCookie` / `clearCookie`
 * helpers to each reply.
 *
 * The reply helpers are assigned per-request rather than through `decorate`:
 * a Fastify decorator lands on the instance, not on every reply object, so
 * `reply.setCookie` would be undefined in route handlers.
 */
export function registerCookies(fastify: FastifyInstanceLike): void {
  fastify.addHook("onRequest", (request: FastifyRequest, reply: FastifyReply, done) => {
    const header = request.headers.cookie;
    request.cookies = header ? parseCookieHeader(header) : {};

    reply.setCookie = (name: string, value: string, options: CookieSerializeOptions = {}) => {
      // "auto" follows the connection, so a plain-HTTP dev server still receives a
      // usable cookie while any TLS-terminated deployment gets the secure flag.
      const secure = options.secure === "auto" ? request.protocol === "https" : options.secure;
      reply.header("Set-Cookie", serializeCookie(name, value, { ...options, secure }));
      return reply;
    };

    reply.clearCookie = (
      name: string,
      options: Pick<CookieSerializeOptions, "path" | "domain"> = {},
    ) => {
      reply.header(
        "Set-Cookie",
        serializeCookie(name, "", { ...options, maxAge: 0, expires: new Date(0) }),
      );
      return reply;
    };

    done();
  });
}

interface FastifyInstanceLike {
  addHook(
    name: string,
    hook: (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void,
  ): void;
}
