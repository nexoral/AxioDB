/**
 * SafeErrorMessage - Redacts filesystem paths and internal details from error
 * messages before they are returned to remote clients.
 * @class SafeErrorMessage
 * @example
 * SafeErrorMessage.sanitize(new Error("open '/home/user/db'"));
 * // 'open <path>'
 */
export default class SafeErrorMessage {
  static readonly MAX_MESSAGE_LENGTH = 300;

  static readonly FALLBACK_MESSAGE = "An internal error occurred. Please try again later.";

  /**
   * Sanitizes an error for transmission to a remote client.
   * @param error - The caught error (may be any unknown).
   * @returns A single-line, path-redacted message with a bounded length.
   */
  static sanitize(error: unknown): string {
    const raw =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : error !== undefined
            ? String(error)
            : "";

    let message = raw;
    message = message.replace(/[a-zA-Z]:\\[^\s"'`]+/g, "<path>");
    message = message.replace(/(^|[\s(['"`])[\/][^\s"'`]+/g, "$1<path>");
    message = message.replace(/(^|[\s(['"`])(?:\.\.?(?:[\/\\]|$))[^\s"'`]*/g, "$1<path>");
    message = message.replace(/['"`]\s*<path>\s*['"`]/g, "<path>");
    message = message.replace(/\r?\n/g, " | ").replace(/\s{2,}/g, " ").trim();

    if (!message || message === "<path>") return this.FALLBACK_MESSAGE;

    if (message.length > this.MAX_MESSAGE_LENGTH) {
      message = message.slice(0, this.MAX_MESSAGE_LENGTH - 3) + "...";
    }
    return message;
  }
}