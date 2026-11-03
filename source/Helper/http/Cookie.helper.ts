import { CookieSerializeOptions } from "./HttpTypes";

export default class CookieHelper {
  private static readonly COOKIE_PAIR = /; */;

  public static parse(header: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const pair of header.split(CookieHelper.COOKIE_PAIR)) {
      const index = pair.indexOf("=");
      if (index < 0) continue;
      const name = pair.slice(0, index).trim();
      if (name.length === 0 || name in result) continue;
      result[name] = CookieHelper.decode(pair.slice(index + 1).trim());
    }
    return result;
  }

  public static serialize(name: string, value: string, options: CookieSerializeOptions = {}): string {
    const opt = options;
    const enc = encodeURIComponent;

    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
      throw new TypeError("argument name is invalid");
    }

    const encodedValue = enc(value);
    let str = `${name}=${encodedValue}`;

    if (opt.maxAge !== undefined) {
      const maxAge = Math.floor(opt.maxAge);
      if (Number.isNaN(maxAge)) throw new TypeError("option maxAge is invalid");
      str += `; Max-Age=${maxAge}`;
    }

    if (opt.domain) {
      str += `; Domain=${opt.domain}`;
    }

    if (opt.path) {
      str += `; Path=${opt.path}`;
    }

    if (opt.expires) {
      str += `; Expires=${opt.expires.toUTCString()}`;
    }

    if (opt.httpOnly) {
      str += "; HttpOnly";
    }

    if (opt.secure) {
      str += "; Secure";
    }

    if (opt.sameSite) {
      const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
      switch (sameSite) {
        case true:
        case "strict":
          str += "; SameSite=Strict";
          break;
        case "lax":
          str += "; SameSite=Lax";
          break;
        case "none":
          str += "; SameSite=None";
          break;
      }
    }

    return str;
  }

  private static decode(value: string): string {
    if (!value.includes("%") && !value.includes("+")) return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}
