export const CONFIRMATION_SCHEMA = {
  type: "object",
  properties: {
    confirm: {
      type: "boolean",
      title: "Confirm",
      description: "true runs the destructive operation, anything else aborts it",
    },
  },
  required: ["confirm"],
};

export const NOT_CONFIRMED = {
  statusCode: 409,
  message: "Aborted: this destructive operation was not confirmed by a human reviewer.",
};

export interface ElicitationServer {
  server?: {
    getClientCapabilities?: () => { elicitation?: Record<string, unknown> } | undefined;
    elicitInput?: (params: { message: string; requestedSchema: unknown }) => Promise<{
      action?: string;
      content?: { confirm?: boolean };
    }>;
  };
}

export function withConfirmation<TArgs extends Record<string, unknown>>(
  server: ElicitationServer,
  buildMessage: (args: TArgs) => string,
  handler: (args: TArgs, session?: unknown) => Promise<unknown> | unknown,
) {
  return async (args: TArgs, session?: unknown) => {
    if (server?.server?.getClientCapabilities?.()?.elicitation) {
      const res = await server.server.elicitInput?.({
        message: buildMessage(args),
        requestedSchema: CONFIRMATION_SCHEMA,
      });
      if (res?.action !== "accept" || res?.content?.confirm !== true) {
        return NOT_CONFIRMED;
      }
    }
    return handler(args, session);
  };
}

export const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true };
export const ADDITIVE = { readOnlyHint: false, destructiveHint: false };
export const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true };
