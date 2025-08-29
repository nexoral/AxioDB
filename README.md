
# AxioDB: The Next-Generation Caching Database for Node.js

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)
[![CodeQL](https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql)
[![Socket Security](https://socket.dev/api/badge/npm/package/axiodb)](https://socket.dev/npm/package/axiodb)
[![Push to Registry](https://github.com/AnkanSaha/AxioDB/actions/workflows/Push.yml/badge.svg?branch=main)](https://github.com/AnkanSaha/AxioDB/actions/workflows/Push.yml)

> **AxioDB** is a blazing-fast, production-ready caching database designed for modern Node.js applications, APIs, and frontend frameworks. It combines intelligent memory management, secure file-based storage, and seamless integration with a developer-friendly API. AxioDB was created to solve the pain points of traditional cache management, manual file I/O, and unreliable global object storage—delivering a simple, fast, and reliable solution for projects of any size.

👉 **[Official Documentation](https://axiodb.site/)**: Access full guides, examples, and API references.

---

## � Why AxioDB Exists

As a Node.js backend engineer, setting up Redis for small prototypes, struggling with manual file I/O, and relying on global object storage for caching was inefficient and unreliable. AxioDB was born to:
- Provide a simple, fast, and reliable caching solution for any project size
- Offer proper algorithms and memory management for production environments
- Deliver sub-millisecond response times with intelligent architecture
- Eliminate the complexity of traditional cache management systems

---

## 🚀 Key Features

- **Intelligent Caching:** Advanced `InMemoryCache` system with automatic eviction policies and smart data persistence
- **Production Security:** Enterprise-grade AES-256 encryption for sensitive cached data and secure access controls
- **Frontend Integration:** Seamless integration with React, Vue, Angular, and all modern frontend frameworks
- **Chainable Query Methods:** Fluent API for real-time data retrieval and filtering (`.query()`, `.Sort()`, `.Limit()`, `.Skip()`)
- **Aggregation Pipelines:** MongoDB-compatible aggregation operations (`$match`, `$group`, `$sort`, `$project`, etc.)
- **Bulk Operations:** High-performance bulk insert, update, and delete operations (`insertMany`, `UpdateMany`, `DeleteMany`)
- **Tree-like Structure:** Hierarchical data storage for efficient retrieval and organization
- **Auto Indexing:** Optimized indexes on document IDs for lightning-fast queries
- **Single Instance Architecture:** Unified management for unlimited databases, collections, and documents
- **Web-Based GUI Dashboard:** Visual database administration, query execution, and real-time monitoring at `localhost:27018`
- **Zero-Configuration Setup:** Serverless architecture—install and start building instantly
- **Custom Database Path:** Flexible storage locations for better project organization

---

## 🏆 Performance Comparison

| Feature                | Traditional JSON DBMS | AxioDB                |
|------------------------|----------------------|-----------------------|
| Storage                | Single JSON file     | Tree-structured files |
| Caching                | None                 | InMemoryCache         |
| Indexing               | None                 | Auto documentId       |
| Query Speed            | Linear               | Sub-millisecond (O(1))|
| Scalability            | Poor                 | Excellent             |

**Benchmark:** AxioDB's documentId search is up to **10x faster** than traditional JSON DBMSs (tested with 1M+ documents).

---

## 🛡️ Security

- **AES-256 Encryption:** Optional for collections, with auto-generated or custom keys
- **Secure Storage:** Data stored in `.axiodb` files with file-level isolation and locking
- **InMemoryCache:** Minimizes disk reads and exposure of sensitive data
- **Configurable Access Controls:** Protects against unauthorized access
- **Automatic Cache Invalidation:** Ensures stale data is never served

**Best Practices:**
- Use strong, unique encryption keys
- Never hardcode keys—use environment variables or secure key management
- Implement proper access controls and regular backups

For vulnerabilities, see [SECURITY.md](SECURITY.md).

---

## ⚙️ Architecture & Internal Mechanisms

### Tree Structure for Fast Data Retrieval
Hierarchical storage enables O(1) document lookups, logarithmic query time, and efficient indexing. Each document is isolated in its own file, supporting selective loading and easy backup.

### Worker Threads for Parallel Processing
Leverages Node.js Worker Threads for non-blocking I/O, multi-core utilization, and scalable performance—especially for read operations.

### Two-Pointer Searching Algorithm
Optimized for range queries and filtered searches, minimizing memory usage and computational overhead.

### Query Processing Pipeline
Intelligent caching, parallelized processing, lazy evaluation, and just-in-time query optimization for maximum throughput.

### Single Instance Architecture
Ensures ACID compliance, strong data consistency, and simplified deployment. One AxioDB instance manages all databases and collections.

### Designed for Node.js Developers
Native JavaScript API, promise-based interface, lightweight dependency, and simple learning curve.

---

## 📦 Installation

```bash
npm install axiodb@latest --save
```

---

## 🛠️ Usage

> **Note:** Only one AxioDB instance should be initialized per application for consistency and security.

### Collection Creation Options

```javascript
createCollection(
  name: string,           // Name of the collection (required)
  isSchemaNeeded: boolean, // Whether schema validation is needed (required)
  schema?: object | any,  // Schema definition (required if isSchemaNeeded is true, empty {} if false)
  isEncrypted?: boolean,  // Whether to encrypt the collection (default: false)
  encryptionKey?: string  // Custom encryption key (optional)
)
```

### Example

```javascript
const { AxioDB, SchemaTypes } = require("axiodb");
const db = new AxioDB();
const schema = {
  name: SchemaTypes.string().required(),
  age: SchemaTypes.number().min(0).required(),
  email: SchemaTypes.string().email().required()
};
const userDB = await db.createDB("MyDB");
const userCollection = await userDB.createCollection("Users", true, schema, true, "mySecretKey");
await userCollection.insert({ name: "John Doe", email: "john.doe@example.com", age: 30 });
const results = await userCollection.query({ age: { $gt: 25 } }).Limit(10).Sort({ age: 1 }).exec();
console.log(results);
```

---

## 🌟 Advanced Features

- **Multiple Databases:** Architect scalable apps with multiple databases and collections, each with specific schemas and security
- **Aggregation Pipelines:** Complex data processing with MongoDB-like syntax
- **Encryption:** Military-grade AES-256 encryption for collections
- **Bulk Operations:** Efficient batch insert, update, and delete
- **Flexible Collection Types:** Basic, encrypted, schema-only, or both
- **Custom Query Operators:** `$gt`, `$lt`, `$in`, `$regex`, etc.
- **Schema Validation:** Type, field requirements, and value constraints
- **Performance Optimization:** Fast lookups, pagination, and intelligent caching
- **Enterprise Data Management:** Bulk operations, conditional updates, atomic transactions

---

## 📖 API Reference

### AxioDB
- `createDB(dbName: string, schemaValidation: boolean = true): Promise<Database>`
- `deleteDatabase(dbName: string): Promise<SuccessInterface | ErrorInterface>`

### Database
- `createCollection(name: string, schema: object, crypto?: boolean, key?: string): Promise<Collection>`
- `deleteCollection(name: string): Promise<SuccessInterface | ErrorInterface>`
- `getCollectionInfo(): Promise<SuccessInterface>`

### Collection
- `insert(document: object): Promise<SuccessInterface | ErrorInterface>`
- `query(query: object): Reader`
- `update(query: object): Updater`
- `delete(query: object): Deleter`
- `aggregate(pipeline: object[]): Aggregation`

### Reader
- `Limit(limit: number): Reader`
- `Skip(skip: number): Reader`
- `Sort(sort: object): Reader`
- `setCount(count: boolean): Reader`
- `setProject(project: object): Reader`
- `exec(): Promise<SuccessInterface | ErrorInterface>`

---

## ⚠️ Current Limitations

- **Manual Relationship Management:** No built-in ODM relationship tools; references between collections must be handled manually
- **Workload Optimization:** Best for moderate to high-traffic apps; extremely high-throughput scenarios may require specialized solutions
- **Main Thread Processing:** Ensures consistency but may need optimization for CPU-intensive queries
- **Query Complexity:** Comprehensive MongoDB-like operations; some advanced patterns are in development
- **Single-Node Architecture:** Distributed replication and clustering planned for future releases

---

## 🔮 Future Roadmap

- **Data Export & Import:** JSON, CSV, and native formats
- **Enhanced Web GUI:** Real-time analytics, visual query builder, performance monitoring
- **Comprehensive Documentation:** Tutorials, interactive examples, and API references

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📜 License

MIT License. See [LICENSE](LICENSE).

---

## 🙌 Acknowledgments

Special thanks to all contributors and supporters of AxioDB. Your feedback and contributions make this project better!

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
const collection3 = await db1.createCollection(
  "testCollection3",
  true,
  schema,
  true,
);

// Create an encrypted collection with schema validation and custom encryption key
const collection4 = await db1.createCollection(
  "testCollection4",
  true,
  schema,
  true,
  "myCustomKey",
);

// Create an encrypted collection without schema validation (using empty object for schema)
const collection5 = await db1.createCollection(
  "testCollection5",
  false,
  {},
  true,
);

// Create an encrypted collection without schema and with custom key
const collection6 = await db1.createCollection(
  "testCollection6",
  false,
  {},
  true,
  "myCustomKey",
);
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
  const collectionNoSchema = await db1.createCollection(
    "testCollection2",
    false,
  );
  const collectionExplicitSchema = await db1.createCollection(
    "testCollection3",
    true,
    schema,
  );
  const collectionWithEncryption = await db1.createCollection(
    "testCollection4",
    schema,
    true,
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

  // Create collections with and without schema validation
  const collectionNoSchema = await db1.createCollection(
    "testCollection2",
    false,
  );
  const collectionExplicitSchema = await db1.createCollection(
    "testCollection3",
    true,
    schema,
  );
  const collectionWithEncryption = await db1.createCollection(
    "testCollection4",
    schema,
    true,
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
