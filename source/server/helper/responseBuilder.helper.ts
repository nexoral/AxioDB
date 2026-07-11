/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyReply } from "fastify";

export type ResponseBuilder = {
  statusCode: number;
  message: string;
  data?: any;
};

export default function buildResponse(
  statusCode: number,
  message: string,
  data?: any,
): ResponseBuilder {
  return {
    statusCode,
    message,
    data: data || null,
  };
}

/**
 * Sets the real HTTP response status to match the response body's `statusCode`
 * before returning it. Auth endpoints rely on the actual HTTP status (401/403/etc.)
 * being correct, not just the JSON body field, since API consumers and browsers
 * commonly branch on `response.status` directly for authentication flows.
 */
export function sendResponse(reply: FastifyReply, response: ResponseBuilder): ResponseBuilder {
  reply.code(response.statusCode);
  return response;
}
