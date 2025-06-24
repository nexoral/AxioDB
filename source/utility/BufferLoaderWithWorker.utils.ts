/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";
import paths from "path";

/**
 * Reads data files using worker threads to parallelize the loading process.
 * Each worker processes a chunk of the data files list.
 *
 * @param DataFilesList - An array of file paths to be read.
 * @param cryptoInstance - An instance of a crypto library for decryption if needed.
 * @param path - The base path where the files are located.
 * @param isEncrypted - A boolean indicating if the files are encrypted.
 * @returns {Promise<any[]>} - A promise that resolves to an array of loaded data.
 */
export default async function ReaderWithWorker(
  DataFilesList: string[],
  cryptoInstance: any,
  path: string,
  isEncrypted: boolean,
  storeFileName = false,
): Promise<any[]> {
    const numWorkers = 1; // Use a single worker for simplicity, can be adjusted based on requirements
  const chunkSize = Math.ceil(DataFilesList.length / numWorkers);
  const workerPath: string = paths.resolve(
    __dirname,
    "../engine/node",
    "WorkerForDataLoad.engine.js",
  );
  const tasks: Promise<any[]>[] = [];

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, DataFilesList.length);
    const dataChunk = DataFilesList.slice(start, end);

    tasks.push(
      new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, {
          workerData: {
            chunk: dataChunk,
            cryptoInstance: cryptoInstance,
            path: path,
            isEncrypted: isEncrypted,
            storeFileName: storeFileName,
          },
        });

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
        });
      }),
    );
  }

  const results = await Promise.all(tasks);
  return results.flat();
}
