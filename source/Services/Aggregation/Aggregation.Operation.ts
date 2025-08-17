import ResponseHelper from "../../Helper/response.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import { Console } from "outers";
import ReaderWithWorker from "../../utility/BufferLoaderWithWorker.utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AggregationStage {
  $match?: Record<string, any>;
  $group?: Record<string, any>;
  $sort?: Record<string, any>;
  $project?: Record<string, any>;
  $limit?: number;
  $skip?: number;
  $unwind?: string;
  $addFields?: Record<string, any>;
}

/**
 * Class that performs aggregation operations on data.
 *
 * This class allows for MongoDB-like aggregation pipeline operations on collection data.
 * It supports various stages including $match, $group, $sort, $project, $limit, $skip,
 * $unwind, and $addFields.
 *
 * The class can handle both encrypted and non-encrypted data collections.
 */
export default class Aggregation {
  // property to store the data
  private AllData: any[] = [];
  private readonly Pipeline: AggregationStage;
  private path: string;
  private readonly collectionName: string;
  private readonly ResponseHelper: ResponseHelper;
  private isEncrypted: boolean;
  private encryptionKey?: string;
  private cryptoInstance?: CryptoHelper;
  private readonly Converter: Converter;

  constructor(
    collectionName: string,
    path: string,
    Pipeline: object[] | any,
    isEncrypted: boolean = false,
    encryptionKey?: string,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.isEncrypted = isEncrypted;
    this.encryptionKey = encryptionKey;
    this.AllData = [];
    this.Pipeline = Pipeline;
    this.ResponseHelper = new ResponseHelper();
    this.Converter = new Converter();
    this.cryptoInstance = new CryptoHelper(this.encryptionKey);
  }

  /**
   * Executes the aggregation pipeline on the data.
   *
   * This method processes the aggregation pipeline stages in sequence:
   * - $match: Filters documents based on specified conditions
   * - $group: Groups documents by specified fields and applies aggregation operations
   * - $sort: Sorts documents based on specified fields and order
   * - $project: Reshapes documents by including specified fields
   * - $limit: Limits the number of documents in the result
   * - $skip: Skips a specified number of documents
   * - $unwind: Deconstructs an array field from input documents
   * - $addFields: Adds new fields to documents
   *
   * The method first validates if the pipeline is an array, loads all buffer data,
   * and then processes each stage of the pipeline sequentially.
   *
   * @throws {Error} If the pipeline is not an array
   * @returns {Array<any>} The result of the aggregation pipeline
   */
  public async exec(): Promise<SuccessInterface | ErrorInterface> {
    if (!Array.isArray(this.Pipeline)) {
      throw new Error("Pipeline must be an array of aggregation stages.");
    }
    // Load all buffer raw data from the specified directory
    await this.LoadAllBufferRawData().then((response) => {
      if ("data" in response) {
        Console.green(`${response?.data?.length} Documents Loaded for Aggregation`);
      }
    });

    let result = [...this.AllData];

    for (const stage of this.Pipeline) {
      if (stage.$match) {
        result = result.filter((item) => {
          return Object.entries(stage.$match).every(([key, value]) => {
            const itemValue = item[key] ?? ""; // Ensure item[key] exists

            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              return itemValue === value;
            }

            if (typeof value === "object" && value !== null) {
              if (value instanceof RegExp) {
                return value.test(itemValue);
              }
              if ("$regex" in value) {
                const regexPattern = value.$regex;
                const regexOptions =
                  "$options" in value ? (value.$options as string) : "";
                try {
                  const regex = new RegExp(String(regexPattern), regexOptions);
                  return regex.test(itemValue);
                } catch (error) {
                  Console.red(
                    `Invalid regex: ${regexPattern} with options: ${regexOptions}`,
                    error,
                  );
                  return false;
                }
              }
            }
            return false;
          });
        });
      }
      if (stage.$group) {
        const groupedData: Record<string, any> = {};
        for (const item of result) {
          let groupKey;

          if (typeof stage.$group._id === "string") {
            groupKey = stage.$group._id.startsWith("$")
              ? item[stage.$group._id.substring(1)]
              : stage.$group._id;
          } else if (typeof stage.$group._id === "object") {
            groupKey = JSON.stringify(
              Object.entries(stage.$group._id).reduce(
                (acc, [k, v]) => {
                  const fieldPath = (v as string).replace("$", "");
                  acc[k] = item[fieldPath];
                  return acc;
                },
                {} as Record<string, any>,
              ),
            );
          } else {
            groupKey = "null";
          }

          if (!groupedData[groupKey]) {
            groupedData[groupKey] = { _id: groupKey };
          }

          for (const [key, operation] of Object.entries(stage.$group) as [
            string,
            any,
          ][]) {
            if (key === "_id") continue;
            if (operation.$avg) {
              const field = operation.$avg.replace("$", "");
              groupedData[groupKey][key] = groupedData[groupKey][key] || {
                sum: 0,
                count: 0,
              };
              groupedData[groupKey][key].sum += item[field];
              groupedData[groupKey][key].count += 1;
            }
            if (operation.$sum) {
              const field = operation.$sum.replace("$", "");
              groupedData[groupKey][key] =
                (groupedData[groupKey][key] || 0) + item[field];
            }
          }
        }
        result = Object.values(groupedData).map((group) => {
          for (const key in group) {
            if (group[key] && group[key].sum !== undefined) {
              group[key] = group[key].sum / group[key].count;
            }
          }
          return group;
        });
      }
      if (stage.$sort) {
        const [[key, order]] = Object.entries(stage.$sort);
        const numOrder = Number(order);
        result.sort((a, b) => {
          if (a[key] < b[key]) return -numOrder;
          if (a[key] > b[key]) return numOrder;
          return 0;
        });
      }
      if (stage.$project) {
        result = result.map((item) => {
          const projected: { [key: string]: any } = {};
          for (const key in stage.$project) {
            if (stage.$project[key] === 1) {
              projected[key] = item[key];
            }
          }
          return projected;
        });
      }
      if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      }
      if (stage.$skip) {
        result = result.slice(stage.$skip);
      }
      if (stage.$unwind) {
        const field = stage.$unwind.replace("$", "");
        result = result.flatMap((item) => {
          return Array.isArray(item[field])
            ? item[field].map((value) => ({ ...item, [field]: value }))
            : [item];
        });
      }
      if (stage.$addFields) {
        result = result.map((item) => ({ ...item, ...stage.$addFields }));
      }
    }

    return this.ResponseHelper.Success(result);
  }

  /**
   * Loads all buffer raw data from the specified directory.
   *
   * This method performs the following steps:
   * 1. Checks if the directory is locked.
   * 2. If the directory is not locked, it lists all files in the directory.
   * 3. Reads each file and decrypts the data if encryption is enabled.
   * 4. Stores the decrypted data in the `AllData` array.
   * 5. If the directory is locked, it unlocks the directory, reads the files, and then locks the directory again.
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a success or error response.
   *
   * @throws {Error} Throws an error if any operation fails.
   */
  private async LoadAllBufferRawData(): Promise<
    SuccessInterface | ErrorInterface
  > {
    try {
      // Check if Directory Locked or not
      const isLocked = await new FolderManager().IsDirectoryLocked(this.path);
      if ("data" in isLocked) {
        // If Directory is not locked
        if (isLocked.data === false) {
          // Read List the data from the file
          const ReadResponse = await new FolderManager().ListDirectory(
            this.path,
          );
          if ("data" in ReadResponse) {
            // Store all files in DataFilesList
            const DataFilesList: string[] = ReadResponse.data;
            // Read all files from the directory
            const resultData: any[] = await ReaderWithWorker(
              DataFilesList,
              this.encryptionKey,
              this.path,
              this.isEncrypted,
            );
            this.AllData = resultData;
            return this.ResponseHelper.Success(resultData);
          }
          return this.ResponseHelper.Error("Failed to read directory");
        } else {
          // if Directory is locked then unlock it
          const unlockResponse = await new FolderManager().UnlockDirectory(
            this.path,
          );
          if ("data" in unlockResponse) {
            // Read List the data from the file
            const ReadResponse: SuccessInterface | ErrorInterface =
              await new FolderManager().ListDirectory(this.path);
            if ("data" in ReadResponse) {
              // Store all files in DataFilesList
              const DataFilesList: string[] = ReadResponse.data;
              // Read all files from the directory
              const resultData: any[] = await ReaderWithWorker(
                DataFilesList,
                this.encryptionKey,
                this.path,
                this.isEncrypted,
              );
              this.AllData = resultData;

              // Lock the directory after reading all files
              const lockResponse = await new FolderManager().LockDirectory(
                this.path,
              );
              if ("data" in lockResponse) {
                return this.ResponseHelper.Success(resultData);
              } else {
                return this.ResponseHelper.Error(
                  `Failed to lock directory: ${this.path}`,
                );
              }
            }
            return this.ResponseHelper.Error(
              `Failed to read directory: ${this.path}`,
            );
          } else {
            return this.ResponseHelper.Error(
              `Failed to unlock directory: ${this.path}`,
            );
          }
        }
      } else {
        return this.ResponseHelper.Error(isLocked);
      }
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }
}
