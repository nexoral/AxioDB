/* eslint-disable @typescript-eslint/no-explicit-any */
import { parentPort, workerData } from "worker_threads";

import FileManager from "../Filesystem/FileManager"; // Replace with real imports
import Converter from "../../Helper/Converter.helper"; // Replace with your actual converter logic
import { SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import ResponseHelper from "../../Helper/response.helper";

interface ErrorInterface {
  error: string;
  [key: string]: any;
}

const { chunk, cryptoInstance, path, isEncrypted, storeFileName } = workerData;
const result: unknown[] = [];

/*
* Worker for reading files in parallel.
* It processes files in pairs from both ends of the chunk array.
* If cryptoInstance is provided, it decrypts the file content.
* The results are stored in the result array, either with or without file names based on storeFileName flag.
* If an error occurs, it sends an error message back to the parent thread.
*/
async function processFiles() {
  let left = 0;
  let right = chunk.length - 1;

  try {
    while (left <= right) {
      const indices = [];

      for (let i = 0; i < 2 && left + i <= right; i++) indices.push(left + i);
      for (let i = 0; i < 2 && right - i > left + 1; i++)
        indices.push(right - i);

      for (const index of indices) {
        const fileName = chunk[index];
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
                result.push({
                  fileName: fileName,
                  data: new Converter().ToObject(ContentResponse),
                });
              } else {
                // Store all Decrypted Data in AllData
                result.push(new Converter().ToObject(ContentResponse));
              }
            } else {
              if (storeFileName == true) {
                result.push({
                  fileName: fileName,
                  data: new Converter().ToObject(ReadFileResponse.data),
                });
              } else {
                result.push(new Converter().ToObject(ReadFileResponse.data));
              }
            }
          } else {
            return new ResponseHelper().Error(
              `Failed to read file: ${fileName}`,
            );
          }
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
        }
      }

      left += 2;
      right -= 2;
    }

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
