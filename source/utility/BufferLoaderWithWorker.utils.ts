import paths from "path";
import os from "os";
import FileManager from "../engine/Filesystem/FileManager";
import Converter from "../Helper/Converter.helper";
import Logger from "../Helper/Logger.helper";
import WorkerPool from "../Helper/WorkerPool.helper";

export default async function ReaderWithWorker(
  DataFilesList: string[],
  path: string,
  storeFileName = false,
): Promise<unknown[]> {
  if (DataFilesList.length < 150) {
    const fileManager = new FileManager();
    const converter = new Converter();

    const filePromises = DataFilesList.map(async (fileName) => {
      try {
        const readFileResponse = await fileManager.ReadFile(`${path}/${fileName}`);

        if ("data" in readFileResponse) {
          const fileData = readFileResponse.data as string;
          if (storeFileName) {
            return {
              fileName,
              data: converter.ToObject(fileData),
            };
          } else {
            return converter.ToObject(fileData);
          }
        } else {
          Logger.error(`Failed to read file: ${fileName}`);
          return null;
        }
      } catch (error) {
        Logger.error(`Error processing file ${fileName}:`, error);
        return null;
      }
    });

    const fileResults = await Promise.all(filePromises);
    return fileResults.filter((r) => r !== null);
  }

  const workerPath = paths.resolve(
    __dirname,
    "../engine/node",
    "WorkerForDataLoad.engine.js",
  );

  const pool = WorkerPool.getPool(workerPath);

  if (DataFilesList.length < 5000) {
    return await pool.execute<
      { chunk: string[]; path: string; storeFileName: boolean },
      unknown[]
    >({
      chunk: DataFilesList,
      path,
      storeFileName,
    });
  }

  const numWorkers = Math.min(os.cpus().length, 4);
  const chunkSize = Math.ceil(DataFilesList.length / numWorkers);
  const tasks: Promise<unknown[]>[] = [];

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, DataFilesList.length);
    if (start >= end) break;
    const dataChunk = DataFilesList.slice(start, end);

    tasks.push(
      pool.execute<
        { chunk: string[]; path: string; storeFileName: boolean },
        unknown[]
      >({
        chunk: dataChunk,
        path,
        storeFileName,
      }),
    );
  }

  const results = await Promise.all(tasks);
  return results.flat();
}
