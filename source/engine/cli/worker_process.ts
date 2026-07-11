import { exec, spawn } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

export default class WorkerProcess {
  public async execCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command);
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
