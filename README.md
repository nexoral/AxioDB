# AxioDB

AxioDB is a fast, lightweight, and scalable open-source DBMS designed for modern applications. It supports `.axiodb` file-based data storage, simple APIs, and secure data management, making it ideal for projects requiring efficient and flexible database solutions.

AxioDB is specifically designed for small to medium-sized websites, blogs, and personal projects. While it provides excellent performance for these use cases, please note that it is currently optimized for smaller data loads rather than massive enterprise-level datasets. We are continuously working to improve performance and scalability in future updates.

---

## 🚀 Features

- **Schema Support:** Define schemas to structure your data for consistency and validation.
- **Chainable Query Methods:** Use methods like `.query()`, `.Sort()`, `.Limit()`, and `.Skip()` for powerful query filtering.
- **Node.js Streams for Efficiency:** Handle large datasets seamlessly with optimized read/write operations.
- **Encryption Support:** Secure sensitive data with optional encryption for collections.
- **Aggregation Pipelines:** Perform advanced data operations like `$match`, `$sort`, `$group`, and more.
- **Simple Setup:** No additional database server required—just install and start using.

---

## 🔮 Future Plans

We're actively working to enhance AxioDB with several exciting features and improvements:

- **In-Memory Cache Strategy:** Implementing an efficient caching mechanism to significantly speed up query operations.
- **Performance Optimizations:** Continuous improvements to make data handling faster and more efficient.
- **Extended Query Capabilities:** Additional operators and more flexible querying options.
- **Improved Documentation:** More examples, tutorials, and API references.
- **Better TypeScript Support:** Enhanced type definitions for better developer experience.

We invite all developer enthusiasts to contribute to making AxioDB more reliable and powerful. Your insights and contributions can help shape the future of this project!

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
  const result = await users.query({ age: { $gt: 25 } }).Limit(10).exec();
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
  const collection1 = await DB1.createCollection("collection1", schema, true, "secretKey");

  // Insert data
  for (let i = 0; i < 300; i++) {
    await collection1.insert({ name: `User${i}`, age: i + 18 });
  }

  // Query data
  const results = await collection1.query({}).Sort({ age: -1 }).Limit(10).exec();
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
const aggregationResult = await collection1.aggregate([
  { $match: { name: { $regex: "User" } } },
  { $project: { name: 1, age: 1 } },
  { $sort: { age: -1 } },
  { $limit: 10 },
]).exec();

console.log("Aggregation Result:", aggregationResult);
```

---

### 3. **Encryption**

Enable encryption for sensitive data by providing a secret key during collection creation.

```javascript
const encryptedCollection = await DB1.createCollection("secureCollection", schema, true, "mySecretKey");

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
await collection1.update({ age: 20 }).UpdateOne({ name: "Updated User", gender: "Male" });

// Update multiple documents
await collection1.update({ name: { $regex: "User" } }).UpdateMany({ isActive: true });
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

For vulnerabilities, please refer to the [SECURITY.md](SECURITY.md) file.

---

## 🤝 Contributing

As the sole developer working on this project while maintaining a full-time software engineering career, it can be challenging to dedicate as much time as I'd like to AxioDB's development. If you find this project valuable and believe it solves problems for you, your contributions would be greatly appreciated. 

Whether it's code improvements, documentation updates, bug reports, or feature suggestions - every contribution helps make this project better for everyone. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to get started.

Together, we can build something remarkable that serves the needs of the developer community!

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

Special thanks to all contributors and supporters of AxioDB. Your feedback and contributions make this project better!
