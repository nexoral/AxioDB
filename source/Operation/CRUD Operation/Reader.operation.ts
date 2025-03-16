/* eslint-disable @typescript-eslint/no-explicit-any */
// import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";

// Import All helpers
import responseHelper from "../../Helper/response.helper";
import Converter from "../../Helper/Converter.helper";
import FileManager from "../../Storage/FileManager";
import { CryptoHelper } from "../../Helper/Crypto.helper";

// Import All Utility
import HashmapSearch from "../../utils/HashMapSearch.utils";

/**
 * Class representing a read operation.
 */
export default class Reader {
  private readonly collectionName: string;
  private readonly path: string | any;
  private readonly Converter: Converter;
  private readonly baseQuery: object | any;
  private limit: number | undefined;
  private skip: number | undefined;
  private sort: object | any;
  private isEncrypted: boolean;
  private encryptionKey: string | undefined;
  private cryptoInstance?: CryptoHelper;
  private AllData: any[];

  /**
   * Creates an instance of Read.
   * @param {string} collectionName - The name of the collection.
   * @param {string} path - The data to be read.
   * @param {object} baseQuery - The base query to be used.
   * @param {boolean} isEncrypted - The encryption status.
   * @param {string} encryptionKey - The encryption key.
   */
  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
    isEncrypted: boolean = false,
    encryptionKey?: string,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.limit = 10;
    this.skip = 0;
    this.isEncrypted = isEncrypted;
    this.sort = {};
    this.baseQuery = baseQuery;
    this.Converter = new Converter();
    this.encryptionKey = encryptionKey;
    this.AllData = [];
    if (this.isEncrypted === true) {
      this.cryptoInstance = new CryptoHelper(this.encryptionKey);
    }
  }

  /**
   * Reads the data from a file.
   * @returns {Promise<any>} A promise that resolves with the response of the read operation.
   */
  public async exec(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const ReadResponse = await this.LoadAllBufferRawData();
      if ("data" in ReadResponse) {
        // Search the data from the AllData using HashMapSearch Searcher
        const HashMapSearcher: HashmapSearch = new HashmapSearch(ReadResponse.data);
        const SearchedData: any[] = await HashMapSearcher.find(this.baseQuery);
        // console.log("FinedData", FinedData);
        return new responseHelper().Success(SearchedData);
      }
      return new responseHelper().Error("Failed to read data");
    } catch (error) {
      return new responseHelper().Error(error);
    }
  }

  /**
   * set limit to the query
   * @param {number} limit - The limit to be set.
   * @returns {Reader} - An instance of the Reader class.
   */
  public Limit(limit: number): Reader {
    this.limit = limit;
    return this;
  }

  /**
   * to be skipped to the query
   * @param {number} skip - The skip to be set.
   * @returns {Reader} - An instance of the Reader class.
   */

  public Skip(skip: number): Reader {
    this.baseQuery.skip = skip;
    return this;
  }

  /**
   * to be sorted to the query
   * @param {object} sort - The sort to be set.
   * @returns {Reader} - An instance of the Reader class.
   */
  public Sort(sort: object | any): Reader {
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
            for (let i = 0; i < DataFilesList.length; i++) {
              const ReadFileResponse: SuccessInterface | ErrorInterface =
                await new FileManager().ReadFile(
                  `${this.path}/${DataFilesList[i]}`,
                );
              // Check if the file is read successfully or not
              if ("data" in ReadFileResponse) {
                if (this.isEncrypted === true && this.cryptoInstance) {
                  // Decrypt the data if crypto is enabled
                  const ContentResponse = await this.cryptoInstance.decrypt(
                    this.Converter.ToObject(ReadFileResponse.data),
                  );
                  // Store all Decrypted Data in AllData
                  this.AllData.push(this.Converter.ToObject(ContentResponse));
                } else {
                  this.AllData.push(
                    this.Converter.ToObject(ReadFileResponse.data),
                  );
                }
              } else {
                return new responseHelper().Error(
                  `Failed to read file: ${DataFilesList[i]}`,
                );
              }
            }
            return new responseHelper().Success(this.AllData);
          }
          return new responseHelper().Error("Failed to read directory");
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
              for (let i = 0; i < DataFilesList.length; i++) {
                const ReadFileResponse: SuccessInterface | ErrorInterface =
                  await new FileManager().ReadFile(
                    `${this.path}/${DataFilesList[i]}`,
                  );
                // Check if the file is read successfully or not
                if ("data" in ReadFileResponse) {
                  if (this.isEncrypted === true && this.cryptoInstance) {
                    // Decrypt the data if crypto is enabled
                    const ContaentResponse = await this.cryptoInstance.decrypt(
                      this.Converter.ToObject(ReadFileResponse.data),
                    );
                    // Store all Decrypted Data in AllData
                    this.AllData.push(
                      this.Converter.ToObject(ContaentResponse),
                    );
                  } else {
                    this.AllData.push(
                      this.Converter.ToObject(ReadFileResponse.data),
                    );
                  }
                } else {
                  return new responseHelper().Error(
                    `Failed to read file: ${DataFilesList[i]}`,
                  );
                }
              }

              // Lock the directory after reading all files
              const lockResponse = await new FolderManager().LockDirectory(
                this.path,
              );
              if ("data" in lockResponse) {
                return new responseHelper().Success(this.AllData);
              } else {
                return new responseHelper().Error(
                  `Failed to lock directory: ${this.path}`,
                );
              }
            }
            return new responseHelper().Error(
              `Failed to read directory: ${this.path}`,
            );
          } else {
            return new responseHelper().Error(
              `Failed to unlock directory: ${this.path}`,
            );
          }
        }
      } else {
        return new responseHelper().Error(isLocked);
      }
    } catch (error) {
      return new responseHelper().Error(error);
    }
  }
}
