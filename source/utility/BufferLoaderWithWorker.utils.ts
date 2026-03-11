/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";
import paths from "path";
import os from "os";
import FileManager from "../engine/Filesystem/FileManager";
import Converter from "../Helper/Converter.helper";
import { CryptoHelper } from "../Helper/Crypto.helper";

/**
 * Reads data files using worker threads to parallelize the loading process.
 * For small datasets (<100 files), uses direct file reading to avoid worker thread overhead.
 * Each worker processes a chunk of the data files list.
 *
 * @param DataFilesList - An array of file paths to be read.
 * @param encryptionKey - Encryption key for decryption if needed.
 * @param path - The base path where the files are located.
 * @param isEncrypted - A boolean indicating if the files are encrypted.
 * @param storeFileName - Whether to include the fileName in the result objects.
 * @returns {Promise<any[]>} - A promise that resolves to an array of loaded data.
 */
export default async function ReaderWithWorker(
  DataFilesList: string[],
  encryptionKey: string | undefined,
  path: string,
  isEncrypted: boolean,
  storeFileName = false,
): Promise<any[]> {
  // Fast path: Direct file reading for small datasets (<100 files)
  // Avoids 300-400ms worker thread initialization overhead
  if (DataFilesList.length < 100) {
    const fileManager = new FileManager();
    const converter = new Converter();
    const cryptoInstance = isEncrypted && encryptionKey
      ? new CryptoHelper(encryptionKey)
      : undefined;

    // Process all files in parallel for maximum performance
    const filePromises = DataFilesList.map(async (fileName) => {
      try {
        const ReadFileResponse = await fileManager.ReadFile(`${path}/${fileName}`);

        if ("data" in ReadFileResponse) {
          if (isEncrypted && cryptoInstance) {
            const ContentResponse = await cryptoInstance.decrypt(
              converter.ToObject(ReadFileResponse.data)
            );
            if (storeFileName) {
              return {
                fileName: fileName,
                data: converter.ToObject(ContentResponse),
              };
            } else {
              return converter.ToObject(ContentResponse);
            }
          } else {
            if (storeFileName) {
              return {
                fileName: fileName,
                data: converter.ToObject(ReadFileResponse.data),
              };
            } else {
              return converter.ToObject(ReadFileResponse.data);
            }
          }
        } else {
          console.error(`Failed to read file: ${fileName}`);
          return null;
        }
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        return null;
      }
    });

    const fileResults = await Promise.all(filePromises);
    return fileResults.filter((r) => r !== null);
  }

  // Worker thread path for larger datasets
  const workerPath: string = paths.resolve(
    __dirname,
    "../engine/node",
    "WorkerForDataLoad.engine.js",
  );
  const tasks: Promise<any[]>[] = [];

  // Use single worker for medium datasets (100-4999 files)
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
