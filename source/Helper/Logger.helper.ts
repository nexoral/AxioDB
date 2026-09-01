type LogLevel = "silent" | "error" | "warn" | "info";

const LEVELS: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
};

const envLevel = (process.env.AXIODB_LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
const currentLevel: number = LEVELS[envLevel] ?? LEVELS.info;

export default class Logger {
  static error(message?: unknown, ...optionalParams: unknown[]): void {
    if (currentLevel >= LEVELS.error) {
      if (optionalParams.length > 0) {
        console.error(message, ...optionalParams);
      } else {
        console.error(message);
      }
    }
  }

  static warn(message?: unknown, ...optionalParams: unknown[]): void {
    if (currentLevel >= LEVELS.warn) {
      if (optionalParams.length > 0) {
        console.warn(message, ...optionalParams);
      } else {
        console.warn(message);
      }
    }
  }

  static info(message?: unknown, ...optionalParams: unknown[]): void {
    if (currentLevel >= LEVELS.info) {
      if (optionalParams.length > 0) {
        console.log(message, ...optionalParams);
      } else {
        console.log(message);
      }
    }
  }
}
