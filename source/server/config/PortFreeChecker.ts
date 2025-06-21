/* eslint-disable @typescript-eslint/no-unused-vars */
import net from 'net';
import { exec } from 'child_process';
import { ServerKeys } from './keys';

export function isPortInUse(port: number, host = ServerKeys.LOCALHOST) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true); // Port is in use
          throw new Error(`Port ${port} is already in use. Please Free the port to get the GUI.`);
        } else {
          resolve(false); // Other error
        }
      })
      .once('listening', () => {
        server.close();
        resolve(false); // Port is free
      })
      .listen(port, String(host));
  });
}


export async function checkDockerPortMapping(port:number) {
  exec(`docker ps --format "{{.ID}} {{.Ports}}"`, (error, stdout, _stderr) => {
    if (error) {
      console.error(`Error executing docker: ${error.message}`);
      return;
    }

    const containers = stdout.trim().split('\n');
    const matching = containers.filter(line => line.includes(`:${port}->`));

    if (matching.length > 0) {
      console.log(`Docker container(s) found using port ${port}:`);
      matching.forEach(c => console.log(c));
      throw new Error(`Port ${port} is already mapped to a Docker container. Please stop the container or Please Free the port to get the GUI.`);
    }
  });
}

export default async function checkPortAndDocker(port: number) {
  await isPortInUse(port);
  await checkDockerPortMapping(port);
}
