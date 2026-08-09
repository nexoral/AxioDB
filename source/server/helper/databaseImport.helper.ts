import fs from "fs";
import path from "path";
import { General } from "../../config/Keys/Keys";

/**
 * Import staging: validating an uploaded archive before any of it reaches the live data
 * directory, and serialising concurrent imports of the same database.
 */

/** Thrown when an upload is not a genuine AxioDB export. Callers answer 400. */
export class InvalidExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExportError";
  }
}

/** Thrown when the same database is already present or already being imported. Answer 409. */
export class ImportConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportConflictError";
  }
}

/**
 * Confirms that a staged directory holds one AxioDB database export, and returns its name.
 *
 * The database name comes from the archive's own contents, never from the uploaded
 * filename - two people can export the same database and rename the file to anything, so
 * the filename says nothing about what is inside.
 *
 * `tarGzFolder` archives `{root}/{dbName}`, so a genuine export is exactly one top-level
 * directory containing recognisable AxioDB artefacts.
 *
 * @param stagingDir - Directory the archive was extracted into.
 * @returns The database name the archive contains.
 * @throws {InvalidExportError} When the contents are not an AxioDB export.
 */
export function readExportedDatabaseName(stagingDir: string): string {
  const entries = fs.readdirSync(stagingDir, { withFileTypes: true });

  const directories = entries.filter((entry) => entry.isDirectory());
  const strayFiles = entries.filter((entry) => !entry.isDirectory());

  if (directories.length === 0) {
    throw new InvalidExportError(
      "That archive contains no database folder. Upload the file produced by Export.",
    );
  }
  if (directories.length > 1 || strayFiles.length > 0) {
    throw new InvalidExportError(
      "That archive holds more than one top-level item. An AxioDB export contains exactly one database folder.",
    );
  }

  const databaseName = directories[0].name;
  const databaseDir = path.join(stagingDir, databaseName);

  if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
    throw new InvalidExportError(
      `"${databaseName}" is not a usable database name.`,
    );
  }

  // Allowlist rather than a presence check: a database that has no collections yet is a
  // legitimate export and contains nothing at all, so "must contain X" would reject it.
  // Asking instead that it contain *nothing but* AxioDB shapes accepts the empty case while
  // still rejecting a folder of holiday photos.
  for (const entry of fs.readdirSync(databaseDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      if (entry.name !== General.Collection_Meta_File) {
        throw new InvalidExportError(
          `"${databaseName}" is not an AxioDB export - it contains an unexpected file "${entry.name}".`,
        );
      }
      continue;
    }

    if (!entry.isDirectory()) {
      throw new InvalidExportError(
        `"${databaseName}" contains "${entry.name}", which is neither a file nor a collection folder.`,
      );
    }

    // Each subdirectory must look like a collection: documents, indexes, or WAL, and
    // nothing else. An empty collection folder is fine.
    const collectionDir = path.join(databaseDir, entry.name);
    for (const child of fs.readdirSync(collectionDir, { withFileTypes: true })) {
      const isDocument = child.isFile() && child.name.endsWith(General.DBMS_File_EXT);
      const isInternalDir =
        child.isDirectory() && (child.name === "indexes" || child.name === ".transactions");

      if (!isDocument && !isInternalDir) {
        throw new InvalidExportError(
          `"${databaseName}/${entry.name}" is not an AxioDB collection - it contains "${child.name}".`,
        );
      }
    }
  }

  return databaseName;
}

/**
 * In-process registry of imports currently in flight, keyed by database name.
 *
 * Two people importing *different* databases run concurrently and never meet - each gets
 * its own staging directory. Two people importing the *same* database must not, because
 * both would write the same destination: the second is told who has it instead.
 *
 * A Map is sufficient because AxioDB is a hard singleton - one process owns the data
 * directory, so there is no second server to coordinate with.
 */
const activeImports = new Map<string, string>();

/**
 * Claims the right to import `databaseName`.
 *
 * @param databaseName - Name read from the archive's contents.
 * @param username - Who is importing, so a clash can name them.
 * @throws {ImportConflictError} When another import of the same database is in flight.
 */
export function claimImport(databaseName: string, username: string): void {
  const holder = activeImports.get(databaseName);

  if (holder !== undefined) {
    throw new ImportConflictError(
      holder === username
        ? `You already have an import of "${databaseName}" running.`
        : `"${databaseName}" is currently being imported by ${holder}. Try again once that finishes.`,
    );
  }

  activeImports.set(databaseName, username);
}

/** Releases the claim. Always call from a `finally`. */
export function releaseImport(databaseName: string): void {
  activeImports.delete(databaseName);
}
