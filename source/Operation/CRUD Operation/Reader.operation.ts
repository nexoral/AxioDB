/* eslint-disable @typescript-eslint/no-explicit-any */
// import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";

import responseHelper from "../../Helper/response.helper";
import {
    ErrorInterface,
    SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
// import { General } from "../../config/Keys/Keys";
import Converter from "../../Helper/Converter.helper";
import FileManager from "../../Storage/FileManager";

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

    /**
     * Creates an instance of Read.
     * @param {string} collectionName - The name of the collection.
     * @param {string | any} path - The data to be read.
     */
    constructor(collectionName: string, path: string | any, baseQuery: object | any, isEncrypted = false) {
        this.collectionName = collectionName;
        this.path = path;
        this.limit = 10;
        this.skip = 0;
        this.isEncrypted = isEncrypted;
        this.sort = {};
        this.baseQuery = baseQuery;
        this.Converter = new Converter();
    }

    /**
     * Reads the data from a file.
     * @returns {Promise<any>} A promise that resolves with the response of the read operation.
     */
    public async exac(callback?: typeof Function): Promise<SuccessInterface | ErrorInterface> {
        try {
            // Check if Directory Locked or not
            const isLocked = await new FolderManager().IsDirectoryLocked(this.path);
            if ("data" in isLocked) {
                if (isLocked.data == false) {
                    // Read List the data from the file
                    const ReadResponse = await new FolderManager().ListDirectory(this.path);
                    if ("data" in ReadResponse) {
                        return new responseHelper().Success(ReadResponse.data);
                    }
                    return new responseHelper().Error("Failed to read directory");
                } else {
                    const unlockResponse = await new FolderManager().UnlockDirectory(this.path);
                    if ("data" in unlockResponse) {
                        // Read List the data from the file
                        const ReadResponse = await new FolderManager().ListDirectory(this.path);
                        if ("data" in ReadResponse) {
                            const DataFilesList: string[] = ReadResponse.data;
                            console.log("DataFilesList", DataFilesList);
                            for (let i = 0; i < DataFilesList.length; i++) {
                                const ReadFileResponse = await new FileManager()
                                    .ReadFile(`${this.path}/${DataFilesList[i]}`);
                                if ("data" in ReadFileResponse) {
                                    console.log("readed data", ReadFileResponse.data);
                                }
                            }
                        }
                        return new responseHelper().Error("Failed to read directory");
                    }
                    else {
                        return new responseHelper().Error("Failed to unlock directory");
                    }
                }
            } else {
                return new responseHelper().Error(isLocked);
            }
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
}