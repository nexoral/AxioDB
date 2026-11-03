/// <reference types="node" />
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";

export interface CookieSerializeOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean | "auto";
  sameSite?: "lax" | "strict" | "none" | boolean;
}

export interface MultipartFile {
  filename: string;
  file: Readable & { truncated?: boolean };
}

export interface AuthUser {
  username: string;
  role: string;
  mustChangePassword?: boolean;
}

export interface AxioHttpRequest {
  method: string;
  url: string;
  path: string;
  ip: string;
  query: Record<string, unknown>;
  params: Record<string, string>;
  headers: IncomingHttpHeaders;
  body: unknown;
  cookies: Record<string, string>;
  authUser?: AuthUser;
  raw: IncomingMessage;
  file(): Promise<MultipartFile | null>;
}

export interface AxioHttpResponse {
  status(code: number): this;
  code(code: number): this;
  header(name: string, value: string | number): this;
  type(contentType: string): this;
  setCookie(name: string, value: string, options?: CookieSerializeOptions): this;
  clearCookie(name: string, options?: CookieSerializeOptions): this;
  send(data?: unknown): Promise<void> | void;
  raw: ServerResponse;
  sent: boolean;
}

export type MiddlewareHandler = (
  request: AxioHttpRequest,
  reply: AxioHttpResponse,
) => Promise<void> | void;

export type RouteHandler = (
  request: AxioHttpRequest,
  reply: AxioHttpResponse,
) => Promise<unknown> | unknown;

export interface RouteOptions {
  preHandler?: MiddlewareHandler[];
}
