/* eslint-disable @typescript-eslint/no-explicit-any */
import FileManager from "../Storage/FileManager";
import {ClassBased} from "outers";
import responseHelper from "../Helper/response.helper";

/**
 * Class representing an insertion operation.
 */
export default class Insertion {
    private readonly collectionName: string;
    private readonly data: object | any;

    /**
     * Creates an instance of Insertion.
     * @param {string} collectionName - The name of the collection.
     * @param {object | any} data - The data to be inserted.
     */
    constructor(collectionName: string, data: object | any) {
        this.collectionName = collectionName;
        this.data = data;
    }

  /**
     * Saves the data to a file.
     * @returns {Promise<any>} A promise that resolves with the response of the save operation.
     */
    public async Save(): Promise<any>{
        console.log("00", this.data);
        const DocumentId = await this.generateUniqueDocumentId();
        await  new FileManager().CreateFile(`${this.collectionName}/${DocumentId}.json`);
        const response = await new FileManager().WriteFile(
            `${this.collectionName}/${DocumentId}.json`,
            JSON.stringify(this.data),
        );

        console.log("00", response);
        if (response.status) {
            return await new responseHelper().Success({
                Message: "Data Inserted Successfully",
                DocumentID: DocumentId,
            });
        }
        else {
            return await new responseHelper().Error({
                Message: "Failed to Insert Data",
            });
        }
    }

    /**
     * Generates a unique document ID.
     * @returns {Promise<string>} A promise that resolves with a unique document ID.
     */
    private async generateUniqueDocumentId(): Promise<string> {
        let isExist;
        let ID;
        do {
            ID = new ClassBased.UniqueGenerator(15).RandomWord(true);
            const response = await new FileManager().FileExists(
                `${this.collectionName}/${ID}.json`,
            );
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            response.status ? (isExist = true) : (isExist = false);
        } while (isExist == false);

        return ID;
    }
}