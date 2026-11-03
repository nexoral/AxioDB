import { AxioHttpResponse } from "../../Helper/http/HttpTypes";

export type ResponseBuilder = {
  statusCode: number;
  message: string;
  data?: unknown;
};

export default function buildResponse(
  statusCode: number,
  message: string,
  data?: unknown,
): ResponseBuilder {
  return {
    statusCode,
    message,
    data: data || null,
  };
}

export function sendResponse(reply: AxioHttpResponse, response: ResponseBuilder): ResponseBuilder {
  reply.code(response.statusCode);
  return response;
}
