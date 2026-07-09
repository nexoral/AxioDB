// Minimal zero-dependency ANSI colored console output for startup/status logs.
const ANSI = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

function log(color: string, payload: unknown[]): void {
  for (const item of payload) {
    console.log(`${color}${item}${ANSI.reset}`);
  }
}

export default class Console {
  static green(...payload: unknown[]): void {
    log(ANSI.green, payload);
  }

  static red(...payload: unknown[]): void {
    log(ANSI.red, payload);
  }
}
