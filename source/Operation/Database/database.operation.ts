/* eslint-disable @typescript-eslint/no-explicit-any */
import Collection from "../Collection/collection.operation";
import FileManager from "../../Storage/FileManager";
import FolderManager from "../../Storage/FolderManager";
import path from "path";

/**
 * Represents a database instance.
 */
export default class Database {
    name: string;
    path: string;
    collections: Collection[];
    private fileManager: FileManager;
    private folderManager: FolderManager;
    private metaFileLocation: string;

    constructor(name: string, path: string, metaFileLocation: string) {
        this.name = name;
        this.path = path;
        this.metaFileLocation = metaFileLocation;
        this.collections = [];
        this.fileManager = new FileManager();
        this.folderManager = new FolderManager();
    }

    /**
     * Creates a new collection inside the specified database.
     * @param {string} collectionName - Name of the collection.
     * @returns {Promise<AxioDB>} - Returns the instance of AxioDB.
     */
    public async createCollection(DBName: string, collectionName: string): Promise<Database> {
        const dbMetadata = await this.getMetadata();

        // Find the database in metadata
        const db = dbMetadata.databases.find((db: any) => db.name === DBName);

        if (!db) {
            throw new Error(`Database '${DBName}' not found!`);
        }

        const collectionPath = path.join(db.path, collectionName);
        await this.folderManager.CreateDirectory(collectionPath);

        // Ensure collections array exists
        db.collections = db.collections || [];

        // Add collection metadata
        db.collections.push({
            name: collectionName,
            path: collectionPath,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        db.updated_at = new Date().toISOString();

        // Write updated metadata
        await this.fileManager.WriteFile(
            this.metaFileLocation,
            dbMetadata
        );

        console.log(`Collection Created: ${collectionPath}`);
        return this;
    }


    /**
     * Reads the metadata file.
     */
    private async getMetadata(): Promise<any> {
        const metaData = await this.fileManager.ReadFile(this.metaFileLocation);
        return metaData.status ? metaData : { databases: [] };
    }
}
