/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";
import paths from "path";
import os from "os";
import FileManager from "../engine/Filesystem/FileManager";
import Converter from "../Helper/Converter.helper";

/**
 * Reads data files using worker threads to parallelize the loading process.
 * For small datasets (<100 files), uses direct file reading to avoid worker thread overhead.
 * Each worker processes a chunk of the data files list.
 *
 * @param DataFilesList - An array of file paths to be read.
 * @param path - The base path where the files are located.
 * @param storeFileName - Whether to include the fileName in the result objects.
 * @returns {Promise<any[]>} - A promise that resolves to an array of loaded data.
 */
export default async function ReaderWithWorker(
  DataFilesList: string[],
  path: string,
  storeFileName = false,
): Promise<any[]> {
  // Fast path: Direct file reading for small datasets (<100 files)
  // Avoids 300-400ms worker thread initialization overhead
  if (DataFilesList.length < 100) {
    const fileManager = new FileManager();
    const converter = new Converter();

    // Process all files in parallel for maximum performance
    const filePromises = DataFilesList.map(async (fileName) => {
      try {
        const ReadFileResponse = await fileManager.ReadFile(`${path}/${fileName}`);

        if ("data" in ReadFileResponse) {
          if (storeFileName) {
            return {
              fileName: fileName,
              data: converter.ToObject(ReadFileResponse.data),
            };
          } else {
            return converter.ToObject(ReadFileResponse.data);
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
            path: path,
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
              path: path,
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
