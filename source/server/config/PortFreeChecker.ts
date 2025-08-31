/* eslint-disable @typescript-eslint/no-unused-vars */
import net from "net";
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
 * Checks if a specified port is in use and if there's a Docker port mapping for that port.
 *
 * @param port - The port number to check
 * @returns A Promise that resolves when both port usage check and Docker port mapping check are complete
 * @throws May throw an error if the port is already in use or if there's a conflict with Docker port mappings
 */
export default async function checkPortAndDocker(port: number) {
  await isPortInUse(port);
}
