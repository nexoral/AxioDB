/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import { SchemaTypes } from "../../Models/DataTypes.models";
import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import HashmapSearch from "../../utils/HashMapSearch.utils";
import Sorting from "../../utils/SortData.utils";
import { Console } from "outers";
// Validator
import SchemaValidator from "../../Models/validator.models";
import Insertion from "./Create.operation";
import InMemoryCache from "../../Caching/cache.operation";
import { General } from "../../config/Keys/Keys";

export default class UpdateOperation {
  // Properties
  protected readonly collectionName: string;
  private readonly baseQuery: object | any;
  private readonly path: string;
  private readonly isEncrypted: boolean;
  private readonly encryptionKey: string | undefined;
  private readonly ResponseHelper: ResponseHelper;
  private readonly cryptoInstance?: CryptoHelper;
  private readonly Converter: Converter;
  private allDataWithFileName: any[] = [];
  private sort: object | any;
  private updatedAt: string;
  private schema: object | any;
  private readonly isSchema: boolean;
  private readonly Insertion: Insertion;

  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
    isSchema: boolean = true,
    schema: object | any,
    isEncrypted: boolean = false,
    encryptionKey?: string,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.baseQuery = baseQuery;
    this.isEncrypted = isEncrypted;
    this.encryptionKey = encryptionKey;
    this.updatedAt = new Date().toISOString();
    this.sort = {};
    this.isSchema = isSchema;
    this.schema = schema;
    this.Insertion = new Insertion(this.collectionName, this.path);
    this.ResponseHelper = new ResponseHelper();
    this.Converter = new Converter();
    if (this.isEncrypted === true) {
      this.cryptoInstance = new CryptoHelper(this.encryptionKey);
    }
    this.allDataWithFileName = []; // To store all data with file name
  }

  /**
   * Updates a single document that matches the base query.
   *
   * This method performs the following operations:
   * 1. Searches for documents matching the base query
   * 2. If documents are found, selects the first document (or first after sorting if sort criteria are provided)
   * 3. Deletes the existing document file
   * 4. Inserts a new file with updated data using the same document ID
   *
   * @param newData - The new data to replace the existing document
   * @returns A Promise resolving to:
   *          - Success with updated data and previous data if successful
   *          - Error if any step fails
   * @throws May throw errors during file operations or data processing
   */
  public async UpdateOne(
    newData: object | any,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      // Insert the updatedAt field in schema & data
      this.schema.updatedAt = SchemaTypes.date().required();
      newData.updatedAt = new Date().toISOString();

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      // if schema is not provided, set it to default
      if (this.isSchema === false) {
        this.schema = {}
      }
      else {
        throw new Error("Schema is not provided");
      }


      // delete the extra fields from the schema if not present in the data
      for (const key in newData) {
        if (this.schema[key]) {
          const newSchema = {
            [key]: this.schema[key],
          };
          this.schema = newSchema;
        }
      }

      // if schema is provided, then validate the data
      if (this.isSchema) {
        // Validate the data
        const validator = await SchemaValidator(this.schema, newData, false);

        if (validator?.details) {
          Console.red("Validation Error", validator.details);
          return this.ResponseHelper.Error(validator.details);
        }
      }

      // if documentId is provided in the baseQuery then read the file with the documentId
      let ReadResponse; // Read Response Holder
      if (this.baseQuery?.documentId !== undefined) {
        const FilePath = [
          `.${this.baseQuery.documentId}${General.DBMS_File_EXT}`,
        ];
        ReadResponse = await this.LoadAllBufferRawData(FilePath);
      } else {
        ReadResponse = await this.LoadAllBufferRawData();
      }

      if ("data" in ReadResponse) {
        const SearchedData = await new HashmapSearch(ReadResponse.data).find(
          this.baseQuery,
          "data",
        );
        if (SearchedData.length === 0) {
          return this.ResponseHelper.Error(
            "No data found with the specified query",
          );
        }

        let selectedFirstData = SearchedData[0]; // Select the first data
        let fileName: string = selectedFirstData?.fileName; // Get the file name
        const documentOldData = selectedFirstData.data; // Get the old data

        // Sort the data if sort is provided then select the first data for deletion
        if (Object.keys(this.sort).length === 0) {
          selectedFirstData = SearchedData[0]; // Select the first data
          fileName = selectedFirstData?.fileName; // Get the file name
        } else {
          const Sorter: Sorting = new Sorting(SearchedData, this.sort);
          const SortedData: any[] = await Sorter.sort("data"); // Sort the data
          selectedFirstData = SortedData[0]; // Select the first data
          fileName = selectedFirstData?.fileName; // Get the file name
        }
        const documentId: string = fileName.startsWith(".")
          ? fileName.slice(1).split(".")[0]
          : fileName.split(".")[0];

        // Update All new Fields in the old data
        for (const key in newData) {
          documentOldData[key] = newData[key];
          // also change the updatedAt field
          documentOldData.updatedAt = this.updatedAt;
        }

        // Delete the file
        const deleteResponse = await this.deleteFileUpdate(fileName);
        if ("data" in deleteResponse) {
          // Insert the new Data in the file
          const InsertResponse = await this.insertUpdate(
            documentOldData,
            documentId,
          );
          if ("data" in InsertResponse) {
            await InMemoryCache.clearAllCache(); // clear the cache
            return this.ResponseHelper.Success({
              message: "Data updated successfully",
              newData: newData,
              previousData: selectedFirstData.data,
              documentId: documentId,
            });
          } else {
            return this.ResponseHelper.Error("Failed to insert data");
          }
        } else {
          return this.ResponseHelper.Error("Failed to delete file");
        }
      } else {
        return this.ResponseHelper.Error("Failed to read  raw data");
      }
    } catch (error) {
      return this.ResponseHelper.Error("Failed to update data");
    }
  }

  /**
   * Updates multiple documents that match the base query.
   *
   * This method performs the following operations:
   * 1. Searches for documents matching the base query
   * 2. Deletes the existing documents
   * 3. Inserts new files with updated data for each document
   *
   * @param newData - The new data to replace the existing documents
   * @returns A Promise resolving to:
   *          - Success with updated data and previous data if successful
   *          - Error if any step fails
   * @throws May throw errors during file operations or data processing
   */
  public async UpdateMany(
    newData: object | any,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      // Insert the updatedAt field in schema & data
      this.schema.updatedAt = SchemaTypes.date().required();
      newData.updatedAt = new Date().toISOString();

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      // if schema is provided, then validate the data
      if (this.isSchema) {
        // Validate the data
        const validator = await SchemaValidator(this.schema, newData, false);

        if (validator?.details) {
          Console.red("Validation Error", validator.details);
          return this.ResponseHelper.Error(validator.details);
        }
      }

      // delete the extra fields from the schema if not present in the data
      for (const key in newData) {
        if (this.schema[key]) {
          const newSchema = {
            [key]: this.schema[key],
          };
          this.schema = newSchema;
        }
      }
      // Validate the data
      const validator = await SchemaValidator(this.schema, newData, true);

      if (validator?.details) {
        Console.red("Validation Error", validator.details);
        return this.ResponseHelper.Error(validator.details);
      }

      const ReadResponse = await this.LoadAllBufferRawData();
      if ("data" in ReadResponse) {
        const SearchedData = await new HashmapSearch(ReadResponse.data).find(
          this.baseQuery,
          "data",
        );
        if (SearchedData.length === 0) {
          return this.ResponseHelper.Error(
            "No data found with the specified query",
          );
        }

        const documentIds: string[] = [];
        for (let i = 0; i < SearchedData.length; i++) {
          let selectedData = SearchedData[i]; // Select the first data
          let fileName: string = selectedData?.fileName; // Get the file name
          const documentOldData = selectedData.data; // Get the old data

          // Sort the data if sort is provided then select the first data for deletion
          if (Object.keys(this.sort).length === 0) {
            selectedData = SearchedData[i]; // Select the first data
            fileName = selectedData?.fileName; // Get the file name
          } else {
            const Sorter: Sorting = new Sorting(SearchedData, this.sort);
            const SortedData: any[] = await Sorter.sort("data"); // Sort the data
            selectedData = SortedData[i]; // Select the first data
            fileName = selectedData?.fileName; // Get the file name
          }
          const documentId: string = fileName.startsWith(".")
            ? fileName.slice(1).split(".")[0]
            : fileName.split(".")[0];
          documentIds.push(documentId);

          // Update All new Fields in the old data
          for (const key in newData) {
            documentOldData[key] = newData[key];
            // also change the updatedAt field
            documentOldData.updatedAt = this.updatedAt;
          }

          // Delete the file
          const deleteResponse = await this.deleteFileUpdate(fileName);
          if ("data" in deleteResponse) {
            // Insert the new Data in the file
            const InsertResponse = await this.insertUpdate(
              documentOldData,
              documentId,
            );
            if ("data" in InsertResponse) {
              continue;
            } else {
              return this.ResponseHelper.Error("Failed to insert data");
            }
          } else {
            return this.ResponseHelper.Error("Failed to delete file");
          }
        }
        await InMemoryCache.clearAllCache(); // clear the cache
        return this.ResponseHelper.Success({
          message: "Data updated successfully",
          newData: newData,
          documentIds: documentIds,
        });
      } else {
        return this.ResponseHelper.Error("Failed to read  raw data");
      }
    } catch (error) {
      return this.ResponseHelper.Error("Failed to update data");
    }
  }

  /**
 * to be sorted to the query    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt; // Initially updatedAt is same as createdAt
 * @param {object} sort - The sort to be set.
 * @returns {DeleteOperation} - An instance of the DeleteOperation class.
 */
  public Sort(sort: object | any): UpdateOperation {
    this.sort = sort;
    return this;
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
  private async LoadAllBufferRawData(
    documentIdDirectFile?: string[] | undefined,
  ): Promise<SuccessInterface | ErrorInterface> {
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
            const DataFilesList: string[] =
              documentIdDirectFile !== undefined
                ? documentIdDirectFile
                : ReadResponse.data;
            // Read all files from the directory
            for (let i = 0; i < DataFilesList.length; i++) {
              const ReadFileResponse: SuccessInterface | ErrorInterface =
                await new FileManager().ReadFile(
                  `${this.path}/${DataFilesList[i]}`,
                );
              // Check if the file is read successfully or not
              if ("data" in ReadFileResponse) {
                if (
                  this.isEncrypted === true &&
                  this.cryptoInstance !== undefined
                ) {
                  // Decrypt the data if crypto is enabled
                  const ContentResponse = await this.cryptoInstance.decrypt(
                    this.Converter.ToObject(ReadFileResponse.data),
                  );
                  // Store all Decrypted Data in AllData
                  this.allDataWithFileName.push({
                    fileName: DataFilesList[i],
                    data: this.Converter.ToObject(ContentResponse),
                  });
                } else {
                  this.allDataWithFileName.push({
                    fileName: DataFilesList[i],
                    data: this.Converter.ToObject(ReadFileResponse.data),
                  });
                }
              } else {
                return this.ResponseHelper.Error(
                  `Failed to read file: ${DataFilesList[i]}`,
                );
              }
            }
            return this.ResponseHelper.Success(this.allDataWithFileName);
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
              const DataFilesList: string[] =
                documentIdDirectFile !== undefined
                  ? documentIdDirectFile
                  : ReadResponse.data;
              // Read all files from the directory
              for (let i = 0; i < DataFilesList.length; i++) {
                const ReadFileResponse: SuccessInterface | ErrorInterface =
                  await new FileManager().ReadFile(
                    `${this.path}/${DataFilesList[i]}`,
                  );
                // Check if the file is read successfully or not
                if ("data" in ReadFileResponse) {
                  if (
                    this.isEncrypted === true &&
                    this.cryptoInstance !== undefined
                  ) {
                    // Decrypt the data if crypto is enabled
                    const ContentResponse = await this.cryptoInstance.decrypt(
                      this.Converter.ToObject(ReadFileResponse.data),
                    );
                    // Store all Decrypted Data in AllData
                    this.allDataWithFileName.push({
                      fileName: DataFilesList[i],
                      data: this.Converter.ToObject(ContentResponse),
                    });
                  } else {
                    this.allDataWithFileName.push({
                      fileName: DataFilesList[i],
                      data: this.Converter.ToObject(ReadFileResponse.data),
                    });
                  }
                } else {
                  return this.ResponseHelper.Error(
                    `Failed to read file: ${DataFilesList[i]}`,
                  );
                }
              }

              // Lock the directory after reading all files
              const lockResponse = await new FolderManager().LockDirectory(
                this.path,
              );
              if ("data" in lockResponse) {
                return this.ResponseHelper.Success(this.allDataWithFileName);
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

  /**
   * Deletes a file from the specified path.
   *
   * This method checks if the directory is locked before attempting to delete the file.
   * If the directory is locked, it tries to unlock it, delete the file, and then lock it again.
   *
   * @param fileName - The name of the file to be deleted
   * @returns A response object indicating success or failure
   *          Success response: { status: true, message: "File deleted successfully" }
   *          Error response: { status: false, message: <error message> }
   * @private
   */
  private async deleteFileUpdate(fileName: string) {
    // Check if Directory Locked or not
    const isLocked = await new FolderManager().IsDirectoryLocked(this.path);
    if ("data" in isLocked) {
      // If Directory is not locked
      if (isLocked.data === false) {
        const deleteResponse = await new FileManager().DeleteFile(
          `${this.path}/${fileName}`,
        );
        if ("data" in deleteResponse) {
          return this.ResponseHelper.Success("File deleted successfully");
        } else {
          return this.ResponseHelper.Error("Failed to delete file");
        }
      } else {
        const unlockResponse = await new FolderManager().UnlockDirectory(
          this.path,
        );
        if ("data" in unlockResponse) {
          const deleteResponse = await new FileManager().DeleteFile(
            `${this.path}/${fileName}`,
          );
          if ("data" in deleteResponse) {
            const lockResponse = await new FolderManager().LockDirectory(
              this.path,
            );
            if ("data" in lockResponse) {
              return this.ResponseHelper.Success("File deleted successfully");
            } else {
              return this.ResponseHelper.Error("Failed to lock directory");
            }
          } else {
            return this.ResponseHelper.Error("Failed to delete file");
          }
        } else {
          return this.ResponseHelper.Error("Failed to unlock directory");
        }
      }
    } else {
      return this.ResponseHelper.Error("Failed to delete file");
    }
  }

  /**
   * Inserts a document into the collection.
   * @param {object} data - The data to be inserted.
   * @returns {Promise<any>} - A promise that resolves with the response of the insertion operation.
   */
  public async insertUpdate(
    data: object | any,
    ExistingdocumentId?: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    // Check if data is empty or not
    if (!data) {
      throw new Error("Data cannot be empty");
    }

    // Check if data is an object or not
    if (typeof data !== "object") {
      throw new Error("Data must be an object.");
    }

    // Encrypt the data if crypto is enabled
    if (this.isEncrypted && this.cryptoInstance !== undefined) {
      data = await this.cryptoInstance.encrypt(this.Converter.ToString(data));
    }

    // Save the data
    return await this.Insertion.Save(data, ExistingdocumentId);
  }
}
