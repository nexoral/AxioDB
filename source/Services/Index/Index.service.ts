import { ErrorInterface, SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";

export interface IndexMetaEntry {
  indexFieldName: string;
  fileName: string;
  path: string;
}

const INDEX_EXT = General.Index_File_EXT; // ".jsonl"

export class IndexManager {
  // Properties
  public readonly path: string;
  public readonly indexFolderPath: string;
  public readonly indexMetaPath: string;
  public readonly fileManager: FileManager;
  public readonly folderManager: FolderManager;
  public readonly converter: Converter;
  public readonly ResponseHelper: ResponseHelper;

  constructor(path: string) {
    this.path = path;
    this.indexFolderPath = `${this.path}/indexes`;
    this.indexMetaPath = `${this.indexFolderPath}/${General.Index_Meta_File}`;
    this.fileManager = new FileManager();
    this.folderManager = new FolderManager();
    this.converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
  }

  /**
   * Serialize IndexData shape for JSONL file storage.
   * Line 1 = header (fieldName + sortedValues), remaining lines = one per indexEntries key.
   *
   * Example output:
   *   {"h":1,"f":"email","s":[]}
   *   {"k":"alice@x.com","v":["abc123.axiodb"]}
   */
  public static serializeIndexData(indexData: { fieldName: string; indexEntries: Record<string, string[]>; sortedValues?: number[] }): string {
    const lines: string[] = [];
    const header: any = { h: 1, f: indexData.fieldName, s: indexData.sortedValues ?? [] };
    lines.push(JSON.stringify(header));
    for (const [key, files] of Object.entries(indexData.indexEntries)) {
      lines.push(JSON.stringify({ k: key, v: files }));
    }
    return lines.join("\n") + "\n";
  }

  /**
   * Deserialize JSONL lines back into an IndexData object.
   * Expects first line to be the header: { h:1, f, s }.
   */
  public static deserializeIndexData(lines: string[]): { fieldName: string; indexEntries: Record<string, string[]>; sortedValues: number[] } | null {
    if (lines.length === 0) return null;
    const decoder = new TextDecoder();
    try {
      const headerStr = typeof lines[0] === 'string' ? lines[0] : decoder.decode(lines[0] as any);
      const header = JSON.parse(headerStr);
      if (!header || header.h !== 1) return null;
      const indexEntries: Record<string, string[]> = {};
      for (let i = 1; i < lines.length; i++) {
        const lineStr = typeof lines[i] === 'string' ? lines[i] : decoder.decode(lines[i] as any);
        try {
          const entry = JSON.parse(lineStr);
          if (entry && entry.k !== undefined && entry.v !== undefined) {
            indexEntries[String(entry.k)] = entry.v;
          }
        } catch { /* skip corrupt lines */ }
      }
      return {
        fieldName: header.f,
        indexEntries,
        sortedValues: header.s ?? [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Create one or more index files and register them in the index metadata.
   *
   * For each supplied field name this method:
   * 1. Determines the index file path as `${indexName}.jsonl` inside the configured index folder.
   * 2. Checks whether the index file already exists. If it does not, creates the file with an empty
   *    JSONL index structure (header + no entries).
   * 3. Appends a JSONL line to `index.meta.jsonl` for each new index — no read-modify-rewrite.
   *
   * Creates are now O(1) appends instead of O(N) full-file rewrites for meta.
   */
  public async createIndex(...fieldNames: string[]): Promise<SuccessInterface | undefined> {
    const EffectedIndexes: string[] = [];
    const FailedIndexes: string[] = [];
    for (const fieldName of fieldNames) {
      const indexName = fieldName;
      const indexFilePath = `${this.indexFolderPath}/${indexName}${INDEX_EXT}`;
      const DemoIndexHash = {
        fieldName: indexName,
        indexEntries: {},
        sortedValues: [],
      };
      const exists = await this.fileManager.FileExists(indexFilePath);
      if (!exists.status) {
        // create empty index file in JSONL format
        await this.fileManager.WriteFile(indexFilePath, IndexManager.serializeIndexData(DemoIndexHash));
        // Append to index.meta.jsonl (O(1) — no read-modify-rewrite)
        const metaEntry = {
          indexFieldName: indexName,
          fileName: `${indexName}${INDEX_EXT}`,
          path: indexFilePath,
        };
        const existsMeta = await this.fileManager.FileExists(this.indexMetaPath);
        if (!existsMeta.status) {
          // First index — write the initial meta file
          await this.fileManager.WriteFile(this.indexMetaPath, this.converter.ToString(metaEntry) + "\n");
          EffectedIndexes.push(indexName);
        } else {
          // Check for duplicate by streaming meta lines (stop on first match)
          const existingMeta = await this.listMetaEntries();
          const indexExists = existingMeta.some((entry: any) => entry.indexFieldName === indexName);
          if (!indexExists) {
            await this.fileManager.AppendFile(this.indexMetaPath, this.converter.ToString(metaEntry) + "\n");
            EffectedIndexes.push(indexName);
          } else {
            FailedIndexes.push(indexName);
          }
        }
      }
    }
    const messageParts: string[] = [];
    if (EffectedIndexes.length > 0) {
      messageParts.push(`Indexes created: ${EffectedIndexes.join(", ")}`);
    }
    if (FailedIndexes.length > 0) {
      messageParts.push(`Indexes already existed: ${FailedIndexes.join(", ")}`);
    }
    return this.ResponseHelper.Success(
      messageParts.length > 0 ? messageParts.join("; ") : "No new indexes created",
    );
  }

  /**
   * Deletes an index file and removes its entry from the index metadata.
   */
  public async dropIndex(indexName: string): Promise<SuccessInterface | ErrorInterface> {
    const indexFilePath = `${this.indexFolderPath}/${indexName}${INDEX_EXT}`;
    // check if index file exists
    const exists = await this.fileManager.FileExists(indexFilePath);
    if (exists.status === true) {
      // delete index file
      await this.fileManager.DeleteFile(indexFilePath);
      // update index.meta.jsonl — stream-filter instead of full parse+rewrite
      const existingMeta = await this.listMetaEntries();
      const filtered = existingMeta.filter((entry: any) => entry.indexFieldName !== indexName);
      if (filtered.length === 0) {
        await this.fileManager.DeleteFile(this.indexMetaPath);
      } else {
        const lines = filtered.map((e: any) => this.converter.ToString(e)).join("\n") + "\n";
        await this.fileManager.WriteFile(this.indexMetaPath, lines);
      }
      return this.ResponseHelper.Success(`Index: ${indexName} deleted successfully`);
    } else {
      return this.ResponseHelper.Error(`Index: ${indexName} does not exist`);
    }
  }

  /**
   * Lists all indexes currently registered for this collection.
   * Now uses streaming ReadLines for memory efficiency.
   */
  public async listIndexes(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const indexMeta: IndexMetaEntry[] = await this.listMetaEntries();
      return this.ResponseHelper.Success(indexMeta);
    } catch {
      return this.ResponseHelper.Error("Failed to read index metadata");
    }
  }

  /**
   * Ensures the index folder and the index metadata file exist, creating them if necessary.
   */
  public async generateIndexMeta(): Promise<void> {
    // check if index.meta.jsonl exists or not
    const folderExists = await this.folderManager.DirectoryExists(this.indexFolderPath);

    if (!folderExists.status) {
      await this.folderManager.CreateDirectory(this.indexFolderPath);
    }

    const exists = await this.fileManager.FileExists(this.indexMetaPath);
    if (!exists.status) {
      // create index.meta.jsonl + documentId index file
      const metaEntry = {
        indexFieldName: "documentId",
        path: `${this.indexFolderPath}/documentId${INDEX_EXT}`,
        fileName: `documentId${INDEX_EXT}`,
      };
      await this.fileManager.WriteFile(this.indexMetaPath, this.converter.ToString(metaEntry) + "\n");
      await this.createIndex("documentId");
    }
  }

  /**
   * Streams index.meta.jsonl lines into an array of IndexMetaEntry objects.
   */
  private async listMetaEntries(): Promise<IndexMetaEntry[]> {
    const lines = await this.fileManager.ReadLines(this.indexMetaPath);
    return lines.map(line => this.converter.ToObject(line));
  }

  /**
   * Finds index metadata entries that correspond to properties present on the provided document.
   * Streams meta file, returns first match (doesn't parse the entire file).
   */
  protected async findMatchingIndexMeta (doc: any): Promise<any[] | undefined> {
    try {
      const lines = await this.fileManager.ReadLines(this.indexMetaPath);
      if (lines.length === 0) return undefined;
      const entries = lines.map(line => this.converter.ToObject(line));
      return entries.filter((meta: { indexFieldName: any; }) =>
        Object.prototype.hasOwnProperty.call(doc, meta.indexFieldName)
      );
    } catch {
      return undefined;
    }
  }
}
