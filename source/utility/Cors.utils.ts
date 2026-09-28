import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CORS_CONFIG } from "../server/config/keys";

/**
 * CORS for the control server, written against the same `CORS_CONFIG` the
 * `@fastify/cors` plugin used.
 *
 * Two behaviours are deliberate:
 *  - The origin is echoed back verbatim, never `*`. Browsers reject a wildcard
 *    on a credentialed (cookie-bearing) request, and the GUI's session cookie is
 *    exactly that.
 *  - `Vary: Origin` is always sent, so a shared cache cannot serve one origin's
 *    response to another.
 */
export default function registerCors(fastify: FastifyInstance): void {
  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;

    if (origin && CORS_CONFIG.ORIGIN.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", String(CORS_CONFIG.ALLOW_CREDENTIALS));
      reply.header("Access-Control-Expose-Headers", CORS_CONFIG.EXPOSED_HEADERS.join(", "));
    }

    reply.header("Vary", "Origin");

    if (request.method !== "OPTIONS") {
      return;
    }

    // Echo back what the browser asked for; falling back to our list would
    // reject a legitimate request carrying an extra standard header.
    const requested = request.headers["access-control-request-headers"];
    reply.header(
      "Access-Control-Allow-Headers",
      requested ?? CORS_CONFIG.ALLOWED_HEADERS.join(", "),
    );
    reply.header("Access-Control-Allow-Methods", CORS_CONFIG.METHODS.join(", "));
    reply.header("Access-Control-Max-Age", String(CORS_CONFIG.MAX_AGE));

    // A preflight never reaches a route, so answer it here rather than needing
    // a throwaway OPTIONS handler on every router.
    await reply.code(204).send();
  });
}
