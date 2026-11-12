import FileManager from "../engine/Filesystem/FileManager";
import Converter from "../Helper/Converter.helper";
import Logger from "../Helper/Logger.helper";
import WorkerPool, { calculateOptimalWorkers } from "../Helper/WorkerPool.helper";
import Searcher from "./Searcher.utils";
import RegexGuard from "../Helper/RegexGuard.helper";
import { workerDataLoadScript } from "../engine/node/workerScript.engine";
import { VectorSearchConfig } from "../config/Interfaces/shared.types";

export default async function ReaderWithWorker(
  DataFilesList: string[],
  path: string,
  storeFileName = false,
  query?: Record<string, unknown>,
  vectorConfig?: VectorSearchConfig,
): Promise<unknown[]> {
  const hasQuery = Boolean(query && Object.keys(query).length > 0);
  if (hasQuery) {
    RegexGuard.validateQuery(query);
  }

  if (DataFilesList.length < 150) {
    const fileManager = new FileManager();
    const converter = new Converter();

    const filePromises = DataFilesList.map(async (fileName) => {
      try {
        const readFileResponse = await fileManager.ReadFile(`${path}/${fileName}`);

        if ("data" in readFileResponse) {
          const fileData = readFileResponse.data as string;
          const parsedData = converter.ToObject(fileData) as Record<string, unknown>;

          if (hasQuery && !Searcher.matchesQuery(parsedData, query!)) {
            return null;
          }

          if (storeFileName) {
            return {
              fileName,
              data: parsedData,
            };
          } else {
            return parsedData;
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

  const pool = WorkerPool.getPool(workerDataLoadScript, undefined, true);

  if (DataFilesList.length < 5000) {
    return await pool.execute<
      {
        chunk: string[];
        path: string;
        storeFileName: boolean;
        query?: Record<string, unknown>;
        vectorConfig?: VectorSearchConfig;
      },
      unknown[]
    >({
      chunk: DataFilesList,
      path,
      storeFileName,
      query,
      vectorConfig,
    });
  }

  const numWorkers = calculateOptimalWorkers();
  const chunkSize = Math.ceil(DataFilesList.length / numWorkers);
  const tasks: Promise<unknown[]>[] = [];

  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, DataFilesList.length);
    if (start >= end) break;
    const dataChunk = DataFilesList.slice(start, end);

    tasks.push(
      pool.execute<
        {
          chunk: string[];
          path: string;
          storeFileName: boolean;
          query?: Record<string, unknown>;
          vectorConfig?: VectorSearchConfig;
        },
        unknown[]
      >({
        chunk: dataChunk,
        path,
        storeFileName,
        query,
        vectorConfig,
      }),
    );
  }

  const results = await Promise.all(tasks);
  return results.flat();
}
