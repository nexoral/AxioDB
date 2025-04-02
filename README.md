# AxioDB

AxioDB is a blazing-fast, lightweight, and scalable open-source Database Management System (DBMS) tailored for modern applications. It supports `.axiodb` file-based data storage, offers intuitive APIs, and ensures secure data management. AxioDB is the ultimate solution for developers seeking efficient, flexible, and production-ready database solutions.

---

## 🚀 Features

- **Advanced Schema Validation:** Define robust schemas to ensure data consistency and integrity.
- **Chainable Query Methods:** Leverage powerful methods like `.query()`, `.Sort()`, `.Limit()`, and `.Skip()` for seamless data filtering.
- **Optimized Node.js Streams:** Handle massive datasets effortlessly with high-performance read/write operations.
- **Encryption-First Design:** Protect sensitive data with optional AES-256 encryption for collections.
- **Aggregation Pipelines:** Perform advanced data operations like `$match`, `$sort`, `$group`, and more with MongoDB-like syntax.
- **InMemoryCache Mechanism:** Accelerate query execution by caching frequently accessed data, reducing query response time significantly.
- **Plug-and-Play Setup:** No additional database server required—install and start building instantly.

---

## 🔮 Future Plans

We're committed to continuously enhancing AxioDB with cutting-edge features:

- **Inbuilt Web-Based GUI Dashboard:** Provide a user-friendly, web-based interface similar to PhpMyAdmin for managing databases, collections, and data visually.
- **Data Export and Import Mechanisms:** Enable seamless export and import of data in various formats like JSON, CSV, and more.
- **Docker Image with ODM Integration:** Build a Docker image for this npm package-based DBMS, allowing integration with other programming languages via Object Document Mapping (ODM). Once completed, simply run the Docker image and connect with the ODM.
- **Advanced Indexing:** Implement multi-level indexing for lightning-fast queries.
- **Comprehensive Documentation:** Expand tutorials, examples, and API references for developers.

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

// Initialize AxioDB
const db = new AxioDB();

const main = async () => {
  // Create a database
  const database = await db.createDB("myDatabase");

  // Define a schema
  const userSchema = {
    name: SchemaTypes.string().required(),
    age: SchemaTypes.number().required(),
  };

  // Create a collection with schema
  const users = await database.createCollection("users", userSchema);

  // Insert data
  await users.insert({ name: "John Doe", age: 30 });

  // Query data
  const result = await users
    .query({ age: { $gt: 25 } })
    .Limit(10)
    .exec();
  console.log("Query Result:", result);
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

- **`createDB(dbName: string): Promise<Database>`**  
  Creates a new database.

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
