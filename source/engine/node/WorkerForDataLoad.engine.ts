/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort, workerData } from "worker_threads";

import FileManager from "../Filesystem/FileManager"; // Replace with real imports
import Converter from "../../Helper/Converter.helper"; // Replace with your actual converter logic
import { SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import { CryptoHelper } from "../../Helper/Crypto.helper";

interface ErrorInterface {
  error: string;
  [key: string]: any;
}

const { chunk, encryptionKey, path, isEncrypted, storeFileName } = workerData;
const result: unknown[] = [];

// new CryptoHelper instance
const cryptoInstance = encryptionKey
  ? new CryptoHelper(encryptionKey)
  : undefined;

/*
 * Worker for reading files in parallel.
 * It processes all files concurrently using Promise.all for maximum performance.
 * If cryptoInstance is provided, it decrypts the file content.
 * The results are stored in the result array, either with or without file names based on storeFileName flag.
 * If an error occurs, it sends an error message back to the parent thread.
 */
async function processFiles() {
  try {
    // Process all files in parallel for maximum performance
    const filePromises = chunk.map(async (fileName: string) => {
      try {
        const ReadFileResponse: SuccessInterface | ErrorInterface =
          await new FileManager().ReadFile(`${path}/${fileName}`);

        // Check if the file is read successfully or not
        if ("data" in ReadFileResponse) {
          if (isEncrypted === true && cryptoInstance) {
            // Decrypt the data if crypto is enabled
            const ContentResponse = await cryptoInstance.decrypt(
              new Converter().ToObject(ReadFileResponse.data),
            );
            if (storeFileName == true) {
              // Store Decrypted Data with File Name
              return {
                fileName: fileName,
                data: new Converter().ToObject(ContentResponse),
              };
            } else {
              // Store all Decrypted Data in AllData
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

    // Wait for all file operations to complete
    const results = await Promise.all(filePromises);

    // Filter out null results (failed reads) and add to result array
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
