/**
 * Represents a collection inside a database.
 */
export default class Collection {
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}
