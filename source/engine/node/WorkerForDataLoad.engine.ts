import { parentPort, workerData } from "worker_threads";

import FileManager from "../Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";
import { SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import Logger from "../../Helper/Logger.helper";

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
): Promise<unknown[]> {
  const result: unknown[] = [];

  for (let i = 0; i < chunk.length; i += BATCH_SIZE) {
    const batch = chunk.slice(i, i + BATCH_SIZE);
    const filePromises = batch.map(async (fileName: string) => {
      try {
        const readFileResponse: SuccessInterface | ErrorInterface =
          await fileManager.ReadFile(`${basePath}/${fileName}`);

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
    };

    try {
      const items = await processFiles(
        payload.chunk,
        payload.path,
        Boolean(payload.storeFileName),
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
  const { chunk, path: basePath, storeFileName } = workerData as {
    chunk: string[];
    path: string;
    storeFileName?: boolean;
  };

  processFiles(chunk, basePath, Boolean(storeFileName))
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
