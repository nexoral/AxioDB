import { exec, spawn } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

/**
 * Provides methods to execute and spawn worker processes.
 */
export default class WorkerProcess {
  /**
   * Executes a shell command and returns its standard output as a string.
   *
   * @param command - The command to execute.
   * @returns A promise that resolves with the command's standard output.
   * @throws If the command fails to execute.
   */
  public async execCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  /**
   * Spawns a new process using the given command and arguments, inheriting stdio.
   *
   * @param command - The command to run.
   * @param args - Optional array of arguments for the command.
   * @returns A promise that resolves when the process exits with code 0, or rejects on error.
   * @throws If the process fails to spawn.
   */
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

  /**
   * Returns the operating system type.
   *
   * @returns A string representing the OS type: "windows", "macos", or "linux".
   * @throws If the platform is unsupported.
   */
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
