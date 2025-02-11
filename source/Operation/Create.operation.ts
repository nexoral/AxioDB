/* eslint-disable @typescript-eslint/no-explicit-any */
import FileManager from "../Storage/FileManager";
import { ClassBased } from "outers";
import responseHelper from "../Helper/response.helper";
import {
  ErrorInterface,
  SuccessInterface,
} from "../config/Interfaces/Helper/response.helper.interface";

/**
 * Class representing an insertion operation.
 */
export default class Insertion {
  private readonly collectionName: string;
  private readonly data: object | any;
  private documentId: string | null;

  /**
   * Creates an instance of Insertion.
   * @param {string} collectionName - The name of the collection.
   * @param {object | any} data - The data to be inserted.
   */
  constructor(collectionName: string, data: object | any) {
    this.collectionName = collectionName;
    this.data = data;
    this.documentId = null;
    this.setDocumentID();
  }

  /**
   * Saves the data to a file.
   * @returns {Promise<any>} A promise that resolves with the response of the save operation.
   */
  public async Save(): Promise<SuccessInterface | ErrorInterface | undefined> {
    const response = await new FileManager().WriteFile(
      `${this.collectionName}/${this.documentId}.json`,
      JSON.stringify(this.data),
    );

    if (response.status) {
      return await new responseHelper().Success({
        Message: "Data Inserted Successfully",
        DocumentID: this.documentId,
        Data: {
          ...this.data,
        },
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

  /**
   * Sets the document ID by generating a unique ID.
   */
  private setDocumentID() {
    this.generateUniqueDocumentId().then((ID) => {
      this.documentId = ID;
    });
  }
}
