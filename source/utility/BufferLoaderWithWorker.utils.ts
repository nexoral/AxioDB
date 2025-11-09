/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";
import paths from "path";
import os from "os";

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
  encryptionKey: string | undefined,
  path: string,
  isEncrypted: boolean,
  storeFileName = false,
): Promise<any[]> {
  const workerPath: string = paths.resolve(
    __dirname,
    "../engine/node",
    "WorkerForDataLoad.engine.js",
  );
  const tasks: Promise<any[]>[] = [];

  // Only spawn one worker if fewer than 5000 files
  if (DataFilesList.length < 5000) {
    tasks.push(
      new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, {
          workerData: {
            chunk: DataFilesList,
            encryptionKey: encryptionKey,
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
  } else {
    // For 5000+ files, divide work among multiple workers
    for (let i = 0; i < Math.min(os.cpus().length, DataFilesList.length); i++) {
      const start = i * Math.ceil(DataFilesList.length / Math.min(os.cpus().length, DataFilesList.length));
      const end = Math.min(start + Math.ceil(DataFilesList.length / Math.min(os.cpus().length, DataFilesList.length)), DataFilesList.length);
      const dataChunk = DataFilesList.slice(start, end);

      tasks.push(
        new Promise((resolve, reject) => {
          const worker = new Worker(workerPath, {
            workerData: {
              chunk: dataChunk,
              encryptionKey: encryptionKey,
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
  }

  const results = await Promise.all(tasks);
  return results.flat();
}
