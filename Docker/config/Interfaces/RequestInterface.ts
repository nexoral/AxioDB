/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyRequest } from "fastify";

// Interface for the request body to add user information
export interface RequestBody extends FastifyRequest {
  body: {
    user: {
      [key: string]: any;
    };
  };
}
