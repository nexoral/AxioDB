/* eslint-disable @typescript-eslint/no-unused-vars */
import net from "net";
import { ServerKeys } from "./keys";

export function isPortInUse(port: number, host = ServerKeys.LOCALHOST) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          resolve(true);
          throw new Error(
            `Port ${port} is already in use. Please Free the port to get the GUI.`,
          );
        } else {
          resolve(false);
        }
      })
      .once("listening", () => {
        server.close();
        resolve(false);
      })
      .listen(port, String(host));
  });
}

export default async function checkPortAndDocker(port: number) {
  await isPortInUse(port);
}
