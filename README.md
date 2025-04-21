# AxioDB: A NoSQL Based DBMS

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![CodeQL](https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/AnkanSaha/AxioDB/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/AnkanSaha/AxioDB/tree/main)

AxioDB is a blazing-fast, lightweight, and scalable open-source Database Management System (DBMS) tailored for modern applications. It supports `.axiodb` file-based data storage, offers intuitive APIs, and ensures secure data management. AxioDB is the ultimate solution for developers seeking efficient, flexible, and production-ready database solutions.

## 🌐 Table of Contents

- [🚀 Features](#-features)
- [⚠️ Current Limitations](#-current-limitations)
- [🔮 Future Plans](#-future-plans)
- [🐳 AxioDB Docker - Under Development](#-axiodb-docker---under-development)
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

## 🐳 AxioDB Docker - Under Development

<div align="center">
  <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" alt="Docker Logo" width="100" />
  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" width="80" style="margin-left: 30px;" />
</div>

We're excited to announce that work is in progress on **AxioDB-Docker Image** to extend the power of AxioDB to non-JavaScript languages!

### What to Expect:

- **Multi-Protocol Support:** Connect via TCP, HTTP, gRPC, or WebSocket ports
- **Web-Based GUI Management Dashboard:** Easily manage your databases visually
- **Multi-User System with Authentication:** Secure access controls for your data
- **Language-Agnostic Integration:** Use AxioDB with Python, Java, Go, and more
- **Containerized Deployment:** Simple setup in any environment that supports Docker

### Early Access:

While this feature is still under development, you can try out early versions:

<div align="center">

[![Docker Hub](https://img.shields.io/badge/Docker_Hub-AxioDB-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/theankansaha/axiodb)
[![GitHub Packages](https://img.shields.io/badge/GitHub_Packages-AxioDB-black?style=for-the-badge&logo=github)](https://github.com/AnkanSaha/AxioDB-Docker/pkgs/container/axiodb)

</div>

```bash
# Pull from Docker Hub
docker pull theankansaha/axiodb:latest

# Or pull from GitHub Packages
docker pull ghcr.io/ankansaha/axiodb:latest
```

Stay tuned for more updates on this exciting expansion of AxioDB's capabilities!

---

## 📦 Installation

Install AxioDB via npm:

```bash
npm install axiodb@latest --save
```

---

## 🛠️ Usage

### CommonJS Example

```javascript
const { AxioDB, SchemaTypes } = require("axiodb");

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

  // Create collections
  const collection = await db1.createCollection("testCollection", schema);
  const collection2 = await db1.createCollection(
    "testCollection2",
    schema,
    true,
  );
  const collection3 = await db1.createCollection(
    "testCollection3",
    schema,
    "myKey",
  );

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

  // Create collections
  const collection = await db1.createCollection("testCollection", schema);
  const collection2 = await db1.createCollection(
    "testCollection2",
    schema,
    true,
  );
  const collection3 = await db1.createCollection(
    "testCollection3",
    schema,
    "myKey",
  );

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
