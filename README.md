# AxioDB: A NoSQL DBMS

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![CodeQL](https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql)
[![Socket Security](https://socket.dev/api/badge/npm/package/axiodb)](https://socket.dev/npm/package/axiodb)

AxioDB is a blazing-fast, lightweight, and scalable open-source Database Management System (DBMS) tailored for modern applications. It supports `.axiodb` file-based data storage, offers intuitive APIs, and ensures secure data management. AxioDB is the ultimate solution for developers seeking efficient, flexible, and production-ready database solutions.

👉 **[Official Documentation](https://axiodb.site/)**: Access the full power of AxioDB with detailed guides, examples, and API references.

## 🌐 Table of Contents

- [🚀 Features](#-features)
- [⚠️ Current Limitations](#-current-limitations)
- [🔮 Future Plans](#-future-plans)
- [📦 Installation](#-installation)
- [🛠️ Usage](#-usage)
- [🌟 Advanced Features](#-advanced-features)
- [📖 API Reference](#-api-reference)
- [🔒 Security](#-security)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🙌 Acknowledgments](#-acknowledgments)

## 🚀 Current Featured Features

- **Advanced Schema Validation:** Define robust schemas to ensure data consistency and integrity, with the flexibility to disable validation when needed.
- **Chainable Query Methods:** Leverage powerful methods like `.query()`, `.Sort()`, `.Limit()`, and `.Skip()` for seamless data filtering.
- **Optimized Node.js Streams:** Handle massive datasets effortlessly with high-performance read/write operations.
- **Encryption-First Design:** Protect sensitive data with optional AES-256 encryption for collections.
- **Aggregation Pipelines:** Perform advanced data operations like `$match`, `$sort`, `$group`, and more with MongoDB-like syntax.
- **InMemoryCache Mechanism:** Accelerate query execution by caching frequently accessed data, reducing query response time significantly.
- **Plug-and-Play Setup:** No additional database server required—install and start building instantly.
- **Tree-like Structure:** Store data in a tree-like structure for efficient data retrieval and management.
- **Auto Indexing on documentId:** Automatically create index on documentId for faster queries.
- **Single Instance Architecture:** For data consistency and security, you can initialize only one AxioDB instance with the `new` keyword. Under this single instance, you can create unlimited databases, collections, and documents.
- **Web-Based GUI Dashboard:** When you create an AxioDB instance and run your project, it automatically starts a web-based GUI on `localhost:27018` for visual database management (currently under development).

---

## ⚠️ Current Limitations

While AxioDB offers many powerful features, there are some limitations to consider:

- **No Built-in Relation Tools:** Unlike ODMs such as Mongoose, AxioDB doesn't provide built-in tools for managing document relations. While MongoDB-like NoSQL databases naturally don't enforce relations at the database level, AxioDB currently requires manual handling of references between collections.

- **Not Optimized for Heavy Workloads:** The database may not perform optimally with rapid data input/output scenarios or extremely large datasets (10M+ documents).

- **Single-Thread Operations:** Operations are performed on the main thread which can impact application performance during complex queries.

- **Limited Query Complexity:** Some advanced query patterns found in mature databases are not yet implemented.

- **No Built-in Replication:** Currently lacks distributed data replication capabilities for high availability setups.

We're actively working to address these limitations in future releases.

---

## 🔮 Future Plans

We're committed to continuously enhancing AxioDB with cutting-edge features:

- **Inbuilt Web-Based GUI Dashboard:** Provide a user-friendly, web-based interface similar to PhpMyAdmin for managing databases, collections, and data visually.
- **Data Export and Import Mechanisms:** Enable seamless export and import of data in various formats like JSON, CSV, and more.
- **Docker Image with ODM Integration:** Build a Docker image for this npm package-based DBMS, allowing integration with other programming languages via Object Document Mapping (ODM). Once completed, simply run the Docker image and connect with the ODM.
- **Advanced Indexing:** Implement multi-level indexing for lightning-fast queries.
- **Replication and Sharding:** Introduce support for distributed data replication and sharding for high availability and scalability.
- **Improved Query Optimization:** Enhance query performance with advanced optimization techniques.
- **Data Backup and Restore:** Implement robust backup and restore mechanisms for data safety.
- **Comprehensive Documentation:** Expand tutorials, examples, and API references for developers.

---

## 📦 Installation

Install AxioDB via npm:

```bash
npm install axiodb@latest --save
```

---

## 🛠️ Usage

> **Important Note:** AxioDB uses a single instance architecture. You should initialize only one AxioDB instance with the `new` keyword, under which you can create unlimited databases, collections, and documents. This design ensures data consistency and security across your application.

### Collection Creation Options

When creating collections, you need to specify these parameters in the `createCollection` method:

```javascript
// Signature of createCollection method:
createCollection(
  name: string,           // Name of the collection (required)
  isSchemaNeeded: boolean, // Whether schema validation is needed (required)
  schema?: object | any,  // Schema definition (required if isSchemaNeeded is true, empty {} if false)
  isEncrypted?: boolean,  // Whether to encrypt the collection (default: false)
  encryptionKey?: string  // Custom encryption key (optional, system generates one if not provided)
)
```

Examples:

```javascript
// Create collection with schema validation
const collection1 = await db1.createCollection("testCollection", true, schema);

// Create collection without schema validation
const collection2 = await db1.createCollection("testCollection2", false);

// Create an encrypted collection with schema validation and default encryption key
const collection3 = await db1.createCollection("testCollection3", true, schema, true);

// Create an encrypted collection with schema validation and custom encryption key
const collection4 = await db1.createCollection("testCollection4", true, schema, true, "myCustomKey");

// Create an encrypted collection without schema validation (using empty object for schema)
const collection5 = await db1.createCollection("testCollection5", false, {}, true);

// Create an encrypted collection without schema and with custom key
const collection6 = await db1.createCollection("testCollection6", false, {}, true, "myCustomKey");
```

### CommonJS Example

```javascript
const { AxioDB, SchemaTypes } = require("axiodb");

// Create a single AxioDB instance for your entire application
// This will also start the Web GUI on localhost:27018 (currently under development)
const db = new AxioDB();

const main = async () => {
  // Create multiple databases under the single instance
  const db1 = await db.createDB("testDB");
  const db2 = await db.createDB("testDB2", false);

  // Define a schema
  const schema = {
    name: SchemaTypes.string().required(),
    age: SchemaTypes.number().required().min(1).max(100),
    email: SchemaTypes.string().required().email(),
  };

  // Create collections with and without schema validation
  const collectionNoSchema = await db1.createCollection("testCollection2", false);
  const collectionExplicitSchema = await db1.createCollection("testCollection3", true, schema);
  const collectionWithEncryption = await db1.createCollection("testCollection4", schema, true, "myKey");

  // Insert data
  const saveStatus = await collection.insert({
    name: "Ankan",
    age: 21,
    email: "ankan@example.com",
  });
  console.log(saveStatus);

  // Query data
  const totalDocuments = await collection
    .query({})
    .Limit(1)
    .Skip(0)
    .Sort({ name: 1 })
    .setCount(true)
    .setProject({ name: 1, age: 1 })
    .exec();
  console.log(totalDocuments);

  const FastDocument = await collection
    .query({ documentId: "S4ACDVS6SZ4S6VS" })
    .exec(); // By using documentId you can get the document in Lightning Fast Speed, no matter how many documents are in the collection (Tested with 1000000+ documents)
  console.log(FastDocument);

  const ArrayFirstDocument = await collection
    .query({ documentId: ["S4ACDVS6SZ4S6VS", "VESV61Z6VS16VSE6V1S"] })
    .exec(); // query using an array of documentId to get multiple documents in lightning fast speed, no matter how many documents are in the collection (Tested with 1000000+ documents)
  console.log(ArrayFirstDocument);

  // Update data
  const updatedDocuments = await collection
    .update({ name: { $regex: "Ankan" } })
    .UpdateOne({ name: "Ankan Saha", age: 22 });
  console.log(updatedDocuments);

  // Delete data
  const deletedDocuments = await collection
    .delete({ name: { $regex: "Ankan" } })
    .deleteOne();
  console.log(deletedDocuments);

  // Aggregation
  const response = await collection
    .aggregate([
      { $match: { age: { $gt: 20 }, name: { $regex: "Ankan" } } },
      { $group: { _id: "$age", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, age: "$_id", count: 1 } },
      { $limit: 10 },
      { $skip: 0 },
    ])
    .exec();
  console.log(response);
};

main();
```

---

### ES6 Example

```javascript
import { AxioDB, SchemaTypes } from "axiodb";

const main = async () => {
  const db = new AxioDB();

  // Create a database with schema validation (default)
  const db1 = await db.createDB("testDB");

  // Create a database without schema validation
  const db2 = await db.createDB("testDB2", false);

  // Define a schema
  const schema = {
    name: SchemaTypes.string().required(),
    age: SchemaTypes.number().required().min(1).max(100),
    email: SchemaTypes.string().required().email(),
  };

  // Create collections with and without schema validation
  const collectionNoSchema = await db1.createCollection("testCollection2", false);
  const collectionExplicitSchema = await db1.createCollection("testCollection3", true, schema);
  const collectionWithEncryption = await db1.createCollection("testCollection4", schema, true, "myKey");

  // Insert data
  const saveStatus = await collection.insert({
    name: "Ankan",
    age: 21,
    email: "ankan@example.com",
  });
  console.log(saveStatus);

  // Query data
  const totalDocuments = await collection
    .query({})
    .Limit(1)
    .Skip(0)
    .Sort({ name: 1 })
    .setCount(true)
    .setProject({ name: 1, age: 1 })
    .exec();
  console.log(totalDocuments);

  const FastDocument = await collection
    .query({ documentId: "S4ACDVS6SZ4S6VS" })
    .exec(); // By using documentId you can get the document in Lightning Fast Speed, no matter how many documents are in the collection (Tested with 1000000+ documents)
  console.log(FastDocument);

  const ArrayFirstDocument = await collection
    .query({ documentId: ["S4ACDVS6SZ4S6VS", "VESV61Z6VS16VSE6V1S"] })
    .exec(); // query using an array of documentId to get multiple documents in lightning fast speed, no matter how many documents are in the collection (Tested with 1000000+ documents)
  console.log(ArrayFirstDocument);

  // Update data
  const updatedDocuments = await collection
    .update({ name: { $regex: "Ankan" } })
    .UpdateOne({ name: "Ankan Saha", age: 22 });
  console.log(updatedDocuments);

  // Delete data
  const deletedDocuments = await collection
    .delete({ name: { $regex: "Ankan" } })
    .deleteOne();
  console.log(deletedDocuments);

  // Aggregation
  const response = await collection
    .aggregate([
      { $match: { age: { $gt: 20 }, name: { $regex: "Ankan" } } },
      { $group: { _id: "$age", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, age: "$_id", count: 1 } },
      { $limit: 10 },
      { $skip: 0 },
    ])
    .exec();
  console.log(response);
};

main();
```

---

## 🌟 Advanced Features

### 1. **Creating Multiple Databases and Collections**

```javascript
const { AxioDB, SchemaTypes } = require("axiodb");

const db = new AxioDB();

const setup = async () => {
  const schema = {
    name: SchemaTypes.string().required().max(15),
    age: SchemaTypes.number().required().min(18),
  };

  const DB1 = await db.createDB("DB1");
  const collection1 = await DB1.createCollection(
    "collection1",
    schema,
    true,
    "secretKey",
  );

  // Insert data
  for (let i = 0; i < 300; i++) {
    await collection1.insert({ name: `User${i}`, age: i + 18 });
  }

  // Query data
  const results = await collection1
    .query({})
    .Sort({ age: -1 })
    .Limit(10)
    .exec();
  console.log("Query Results:", results);

  // Delete collection
  await DB1.deleteCollection("collection1");
};

setup();
```

---

### 2. **Aggregation Pipelines**

Perform advanced operations like filtering, sorting, grouping, and projecting data.

```javascript
const aggregationResult = await collection1
  .aggregate([
    { $match: { name: { $regex: "User" } } },
    { $project: { name: 1, age: 1 } },
    { $sort: { age: -1 } },
    { $limit: 10 },
  ])
  .exec();

console.log("Aggregation Result:", aggregationResult);
```

---

### 3. **Encryption**

Enable encryption for sensitive data by providing a secret key during collection creation.

```javascript
const encryptedCollection = await DB1.createCollection(
  "secureCollection",
  schema,
  true,
  "mySecretKey",
);

// Insert encrypted data
await encryptedCollection.insert({ name: "Encrypted User", age: 25 });

// Query encrypted data
const encryptedResult = await encryptedCollection.query({ age: 25 }).exec();
console.log("Encrypted Query Result:", encryptedResult);
```

---

### 4. **Update and Delete Operations**

#### Update Documents

```javascript
// Update a single document
await collection1
  .update({ age: 20 })
  .UpdateOne({ name: "Updated User", gender: "Male" });

// Update multiple documents
await collection1
  .update({ name: { $regex: "User" } })
  .UpdateMany({ isActive: true });
```

#### Delete Documents

```javascript
// Delete a single document
await collection1.delete({ name: "User1" }).deleteOne();

// Delete multiple documents
await collection1.delete({ age: { $lt: 25 } }).deleteMany();
```

---

## 📖 API Reference

### AxioDB

- **`createDB(dbName: string, schemaValidation: boolean = true): Promise<Database>`**  
  Creates a new database. The optional `schemaValidation` parameter (default: true) determines whether schema validation will be enforced for collections in this database.

- **`deleteDatabase(dbName: string): Promise<SuccessInterface | ErrorInterface>`**  
  Deletes a database.

### Database

- **`createCollection(name: string, schema: object, crypto?: boolean, key?: string): Promise<Collection>`**  
  Creates a collection with an optional schema and encryption.

- **`deleteCollection(name: string): Promise<SuccessInterface | ErrorInterface>`**  
  Deletes a collection.

- **`getCollectionInfo(): Promise<SuccessInterface>`**  
  Retrieves information about all collections.

### Collection

- **`createCollection(name: string, schemaOrBoolean: object | boolean, schemaOrEmpty?: object, crypto?: boolean, key?: string): Promise<Collection>`**  
  Creates a collection with optional schema validation and encryption. The parameters are flexible:
  - If the second parameter is a schema object, schema validation is enabled
  - If the second parameter is a boolean, it determines whether schema validation is enabled
  - For collections without schema but with encryption, pass `false, {}, true` as parameters
  - The encryption key parameter is optional - if not provided, a default key will be generated

- **`insert(data: object): Promise<SuccessInterface | ErrorInterface>`**  
  Inserts a document into the collection.

- **`query(query: object): Reader`**  
  Queries documents in the collection.

- **`aggregate(pipeline: object[]): Aggregation`**  
  Performs aggregation operations.

### Reader

- **`Limit(limit: number): Reader`**  
  Sets a limit on the number of documents.

- **`Skip(skip: number): Reader`**  
  Skips a number of documents.

- **`Sort(sort: object): Reader`**  
  Sorts the query results.

- **`exec(): Promise<SuccessInterface | ErrorInterface>`**  
  Executes the query.

---

## 🔒 Security

AxioDB prioritizes data security with features like:

- Optional encryption for collections.
- Secure `.axiodb` file-based storage.
- InMemoryCache for faster and more secure query handling.
  For vulnerabilities, please refer to the [SECURITY.md](SECURITY.md) file.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's code improvements, documentation updates, bug reports, or feature suggestions, your input helps make AxioDB better. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to get started.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

Special thanks to all contributors and supporters of AxioDB. Your feedback and contributions make this project better!
