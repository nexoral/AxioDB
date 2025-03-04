import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import Insertion from "../CRUD Operation/Create.operation";

/**
 * Represents a collection inside a database.
 */
export default class Collection {
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  private Insertion: Insertion;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    // Initialize the Insertion class
    this.Insertion = new Insertion(this.name, this.path);
  }

  /**
   * Inserts a document into the collection.
   * @param {object} data - The data to be inserted.
   * @returns {Promise<any>} - A promise that resolves with the response of the insertion operation.
   */
  public async insert(
    data: object,
  ): Promise<SuccessInterface | ErrorInterface | undefined> {
    // Check if data is empty or not
    if (!data) {
      throw new Error("Data cannot be empty");
    }

    // Check if data is an object or not
    if (typeof data !== "object") {
      throw new Error("Data must be an object.");
    }
    // Save the data
    return await this.Insertion.Save(data);
  }
}
