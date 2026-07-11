/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort, workerData } from "worker_threads";

import FileManager from "../Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";
import { SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import { CryptoHelper } from "../../Helper/Crypto.helper";

interface ErrorInterface {
  error: string;
  [key: string]: any;
}

const { chunk, encryptionKey, path, isEncrypted, storeFileName } = workerData;
const result: unknown[] = [];

const cryptoInstance = encryptionKey
  ? new CryptoHelper(encryptionKey)
  : undefined;

/** Reads all files in `chunk` concurrently via Promise.all, decrypting them if `cryptoInstance` is set. */
async function processFiles() {
  try {
    const filePromises = chunk.map(async (fileName: string) => {
      try {
        const ReadFileResponse: SuccessInterface | ErrorInterface =
          await new FileManager().ReadFile(`${path}/${fileName}`);

        if ("data" in ReadFileResponse) {
          if (isEncrypted === true && cryptoInstance) {
            const ContentResponse = await cryptoInstance.decrypt(
              new Converter().ToObject(ReadFileResponse.data),
            );
            if (storeFileName == true) {
              return {
                fileName: fileName,
                data: new Converter().ToObject(ContentResponse),
              };
            } else {
              return new Converter().ToObject(ContentResponse);
            }
          } else {
            if (storeFileName == true) {
              return {
                fileName: fileName,
                data: new Converter().ToObject(ReadFileResponse.data),
              };
            } else {
              return new Converter().ToObject(ReadFileResponse.data);
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

    const results = await Promise.all(filePromises);
    const validResults = results.filter((r) => r !== null);
    result.push(...validResults);

    if (parentPort) {
      parentPort.postMessage(result);
    }
  } catch (error) {
    if (parentPort) {
      parentPort.postMessage({ error: String(error) });
    }
  }
}

processFiles().catch((error) => {
  console.error("Worker error:", error);
  if (parentPort) {
    parentPort.postMessage({ error: String(error) });
  }
});
