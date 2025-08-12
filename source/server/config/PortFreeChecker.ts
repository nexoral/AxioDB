/* eslint-disable @typescript-eslint/no-unused-vars */
import net from "net";
import { exec } from "child_process";
import { ServerKeys } from "./keys";

/**
 * Checks whether a specific port is already in use.
 *
 * @param port - The port number to check
 * @param host - The host to check the port on, defaults to localhost
 * @returns A Promise that resolves to true if the port is in use, false otherwise
 * @throws {Error} If the port is already in use
 *
 * @example
 * // Check if port 3000 is available
 * try {
 *   const inUse = await isPortInUse(3000);
 *   if (!inUse) {
 *     // Port is free, can use it
 *   }
 * } catch (error) {
 *   console.error(error.message);
 * }
 */
export function isPortInUse(port: number, host = ServerKeys.LOCALHOST) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          resolve(true); // Port is in use
          throw new Error(
            `Port ${port} is already in use. Please Free the port to get the GUI.`,
          );
        } else {
          resolve(false); // Other error
        }
      })
      .once("listening", () => {
        server.close();
        resolve(false); // Port is free
      })
      .listen(port, String(host));
  });
}

/**
 * Checks if a specified port is currently mapped to any running Docker container.
 *
 * This function executes a Docker command to list all running containers and their port mappings,
 * then filters for containers that are using the specified port.
 *
 * @param port - The port number to check for Docker container mappings
 * @throws {Error} If the specified port is already mapped to a Docker container
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * try {
 *   await checkDockerPortMapping(3000);
 *   // Port 3000 is free for use
 * } catch (error) {
 *   // Port 3000 is already in use by a Docker container
 *   console.error(error.message);
 * }
 * ```
 */
export async function checkDockerPortMapping(port: number): Promise<void> {
  exec(`docker ps --format "{{.ID}} {{.Ports}}"`, (error, stdout, _stderr) => {
    if (error) {
      console.error(`Error executing docker: ${error.message}`);
      return;
    }

    const containers = stdout.trim().split("\n");
    const matching = containers.filter((line) => line.includes(`:${port}->`));

    if (matching.length > 0) {
      console.log(`Docker container(s) found using port ${port}:`);
      matching.forEach((c) => console.log(c));
      throw new Error(
        `Port ${port} is already mapped to a Docker container. Please stop the container or Please Free the port to get the GUI.`,
      );
    }
  });
}

/**
 * Checks if Docker is installed on the system.
 *
 * @returns A Promise that resolves to true if Docker is installed, false otherwise
 *
 * @example
 * ```typescript
 * const dockerInstalled = await isDockerInstalled();
 * if (dockerInstalled) {
 *   console.log('Docker is available');
 * } else {
 *   console.log('Docker is not installed');
 * }
 * ```
 */
export async function isDockerInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    exec("docker --version", (error, stdout, stderr) => {
      if (error) {
        resolve(false); // Docker is not installed or not accessible
      } else {
        resolve(true); // Docker is installed
      }
    });
  });
}

/**
 * Checks if a specified port is in use and if there's a Docker port mapping for that port.
 *
 * @param port - The port number to check
 * @returns A Promise that resolves when both port usage check and Docker port mapping check are complete
 * @throws May throw an error if the port is already in use or if there's a conflict with Docker port mappings
 */
export default async function checkPortAndDocker(port: number) {
  await isPortInUse(port);
  const status: boolean = await isDockerInstalled();
  if (status) {
    await checkDockerPortMapping(port);
  }
}
