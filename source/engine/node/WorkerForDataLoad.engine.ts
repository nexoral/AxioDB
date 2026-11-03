import { parentPort, workerData } from "worker_threads";

import FileManager from "../Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";
import { SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import Logger from "../../Helper/Logger.helper";
import Searcher from "../../utility/Searcher.utils";

interface ErrorInterface {
  error: string;
}

const BATCH_SIZE = 128;
const fileManager = new FileManager();
const converter = new Converter();

async function processFiles(
  chunk: string[],
  basePath: string,
  storeFileName: boolean,
  query?: Record<string, unknown>,
): Promise<unknown[]> {
  const result: unknown[] = [];
  const hasQuery = Boolean(query && Object.keys(query).length > 0);

  for (let i = 0; i < chunk.length; i += BATCH_SIZE) {
    const batch = chunk.slice(i, i + BATCH_SIZE);
    const filePromises = batch.map(async (fileName: string) => {
      try {
        const readFileResponse: SuccessInterface | ErrorInterface =
          await fileManager.ReadFile(`${basePath}/${fileName}`);

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

    const batchResults = await Promise.all(filePromises);
    for (let j = 0; j < batchResults.length; j++) {
      const item = batchResults[j];
      if (item !== null) {
        result.push(item);
      }
    }
  }

  return result;
}

if (parentPort) {
  parentPort.on("message", async (msg: unknown) => {
    const payload = msg as {
      jobId?: number;
      chunk: string[];
      path: string;
      storeFileName?: boolean;
      query?: Record<string, unknown>;
    };

    try {
      const items = await processFiles(
        payload.chunk,
        payload.path,
        Boolean(payload.storeFileName),
        payload.query,
      );
      parentPort?.postMessage({
        jobId: payload.jobId,
        result: items,
      });
    } catch (error) {
      parentPort?.postMessage({
        jobId: payload.jobId,
        error: String(error),
      });
    }
  });
}

// Support legacy one-shot execution if workerData is provided
if (workerData && workerData.chunk) {
  const { chunk, path: basePath, storeFileName, query } = workerData as {
    chunk: string[];
    path: string;
    storeFileName?: boolean;
    query?: Record<string, unknown>;
  };

  processFiles(chunk, basePath, Boolean(storeFileName), query)
    .then((results) => {
      if (parentPort) {
        parentPort.postMessage(results);
      }
    })
    .catch((error) => {
      Logger.error("Worker error:", error);
      if (parentPort) {
        parentPort.postMessage({ error: String(error) });
      }
    });
}
