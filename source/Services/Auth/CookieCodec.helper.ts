import { CookiePayload } from "../../config/Interfaces/Auth/auth.interface";

/**
 * Encodes/decodes the session cookie value. The cookie is intentionally not the
 * security boundary by itself - it only carries a random `sid` used to look up the
 * real session record in SessionStore's in-memory map. See SessionStore.service.ts.
 */
export default class CookieCodec {
  public static encode(payload: CookiePayload): string {
    return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  }

  public static decode(rawCookieValue: string): CookiePayload | null {
    try {
      const json = Buffer.from(rawCookieValue, "base64url").toString("utf-8");
      const parsed = JSON.parse(json);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.sid === "string" &&
        typeof parsed.iat === "number"
      ) {
        return parsed as CookiePayload;
      }
      return null;
    } catch {
      return null;
    }
  }
}
