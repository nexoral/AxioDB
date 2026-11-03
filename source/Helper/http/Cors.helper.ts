import { CORS_CONFIG } from "../../server/config/keys";
import { AxioHttpRequest, AxioHttpResponse } from "./HttpTypes";

export default class CorsHelper {
  public static handle(request: AxioHttpRequest, reply: AxioHttpResponse): boolean {
    const origin = request.headers.origin;

    if (origin && typeof origin === "string" && CORS_CONFIG.ORIGIN.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", String(CORS_CONFIG.ALLOW_CREDENTIALS));
      reply.header("Access-Control-Expose-Headers", CORS_CONFIG.EXPOSED_HEADERS.join(", "));
    }

    reply.header("Vary", "Origin");

    if (request.method === "OPTIONS") {
      const requested = request.headers["access-control-request-headers"];
      reply.header(
        "Access-Control-Allow-Headers",
        (typeof requested === "string" ? requested : undefined) ?? CORS_CONFIG.ALLOWED_HEADERS.join(", "),
      );
      reply.header("Access-Control-Allow-Methods", CORS_CONFIG.METHODS.join(", "));
      reply.header("Access-Control-Max-Age", String(CORS_CONFIG.MAX_AGE));
      reply.status(204).send();
      return true;
    }

    return false;
  }
}
