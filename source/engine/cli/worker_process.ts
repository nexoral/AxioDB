import { spawn } from "child_process";

export default class WorkerProcess {
  /**
   * Executes a binary with explicit arguments without a shell, capturing stdout.
   *
   * No shell string is ever constructed, so filenames or paths containing shell
   * metacharacters cannot inject extra commands. Always prefer this over building
   * a shell command when arguments derive from user-controlled paths.
   *
   * @param command - The executable to run (e.g. "du", "wc", "powershell").
   * @param args - Arguments passed verbatim; no quoting or interpolation is applied.
   * @returns The command's captured stdout.
   * @example
   * const size = await worker.execCommandSafely("wc", ["-c", "--", targetPath]);
   */
  public async execCommandSafely(
    command: string,
    args: string[] = [],
  ): Promise<string> {
    try {
      const stdout = await new Promise<string>((resolve, reject) => {
        const child = spawn(command, args, { shell: false });
        let out = "";
        let err = "";
        child.stdout.on("data", (chunk: Buffer) => {
          out += chunk.toString();
        });
        child.stderr.on("data", (chunk: Buffer) => {
          err += chunk.toString();
        });
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) {
            resolve(out);
          } else {
            reject(
              new Error(
                `Command failed with exit code ${code}${err ? `: ${err.trim()}` : ""}`,
              ),
            );
          }
        });
      });
      return stdout;
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  /** Inherits stdio; rejects if the process exits with a non-zero code. */
  public async spawnCommand(
    command: string,
    args: string[] = [],
  ): Promise<void> {
    try {
      const child = spawn(command, args, { stdio: "inherit" });
      return new Promise((resolve, reject) => {
        child.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`Command failed with exit code ${code}`));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to spawn command: ${error}`);
    }
  }

  public static getOS(): string {
    const platform = process.platform;
    if (platform === "win32") {
      return "windows";
    }
    if (platform === "darwin") {
      return "macos";
    }
    if (platform === "linux") {
      return "linux";
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }
}
