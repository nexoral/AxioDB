/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";

// Validator
import Insertion from "./Create.operation";
import InMemoryCache from "../../Memory/memory.operation";
import { General } from "../../config/Keys/Keys";
import ReaderWithWorker from "../../utility/BufferLoaderWithWorker.utils";
import { ReadIndex } from "../Index/ReadIndex.service";

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
  private readonly Insertion: Insertion;

  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
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
      // check if the data is an empty object or not
      if (Object.keys(newData).length === 0 || newData === undefined) {
        throw new Error("Data cannot be an empty.");
      }

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      // if documentId is provided in the baseQuery then read the file with the documentId
      let ReadResponse; // Read Response Holder
      if (this.baseQuery?.documentId !== undefined) {
        const FilePath = [
          `${this.baseQuery.documentId}${General.DBMS_File_EXT}`,
        ];
        ReadResponse = await this.LoadAllBufferRawData(FilePath);
      } else {
        const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery)
        if (fileNames.length > 0) {
          // Load File Names from Index
          ReadResponse = await this.LoadAllBufferRawData(fileNames);
        }
        ReadResponse = await this.LoadAllBufferRawData();
      }

      if ("data" in ReadResponse) {
        const SearchedData = await new Searcher(ReadResponse.data, true).find(
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
        const dataForRest: object | any = { ...documentOldData }; // Get the data for rest of the fields

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
        const documentId: string = fileName.split(".")[0];

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
              newData: documentOldData,
              previousData: dataForRest,
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
      console.log(error);
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
      // check if the data is an empty object or not
      if (Object.keys(newData).length === 0 || newData === undefined) {
        throw new Error("Data cannot be an empty.");
      }

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      newData.updatedAt = new Date().toISOString();

      let ReadResponse;
      const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery)
      if (fileNames.length > 0) {
        // Load File Names from Index
        ReadResponse = await this.LoadAllBufferRawData(fileNames);
      }
      ReadResponse = await this.LoadAllBufferRawData();
      if ("data" in ReadResponse) {
        const SearchedData = await new Searcher(ReadResponse.data, true).find(
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
          const documentId: string = fileName.split(".")[0];
          documentIds.push(documentId);

          // Update All new Fields in the old data
          for (const key in newData) {
            documentOldData[key] = newData[key];
            // also change the updatedAt field
            documentOldData.updatedAt = newData.updatedAt;
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
          effectedData: SearchedData.length,
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
      const DataFilesList: string[] = []
      if (documentIdDirectFile !== undefined) {
        documentIdDirectFile.push(...documentIdDirectFile)
      }
      else {
        // Directly read list of files in directory (no lock/unlock system)
        const ReadResponse = await new FolderManager().ListDirectory(this.path);

        if ("data" in ReadResponse) {
          // filter with .axiodb files only
          ReadResponse.data = ReadResponse.data.filter((file: string) => file.endsWith(".axiodb"));
          DataFilesList.push(...ReadResponse.data);
        }
      }

      // Read all files from the directory
      const resultData: any[] = await ReaderWithWorker(
        DataFilesList,
        this.encryptionKey,
        this.path,
        this.isEncrypted,
        true, // keep extra param
      );

      this.allDataWithFileName = resultData; // Store all data with file name
      return this.ResponseHelper.Success(resultData);

      return this.ResponseHelper.Error("Failed to read directory");
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
  private async insertUpdate(
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
