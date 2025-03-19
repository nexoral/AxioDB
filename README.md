# AxioDB

AxioDB is a fast, lightweight, and scalable open-source DBMS designed for modern applications. It supports JSON-based data storage, simple APIs, and secure data management, making it ideal for projects requiring efficient and flexible database solutions.

## Features

- **Custom Schema Support:** Define custom schemas to structure your data for consistency and validation.
- **Chainable Query Methods:** Use familiar methods like `.find()`, `.skip()`, and `.limit()` for powerful query filtering.
- **Node.js Streams for Efficient Read/Write:** Seamlessly handle large datasets with Node.js streams to avoid performance bottlenecks.
- **Custom Data Storage:** Save and retrieve data directly from JSON files without needing a database server.
- **Flexible Indexing:** Implement indexing to speed up query performance.
- **Secure and Reliable:** Includes optional encryption to protect sensitive data stored in your JSON files.
- **Simple Setup and Lightweight:** No additional database setup required; simply install and start using.

## Installation

To get started with AxioDB, install it via npm:

```shell
npm install axiodb@latest --save
```

## Usage

### CommonJS

```js
const { AxioDB, SchemaTypes } = require("axiodb");

// Initialize AxioDB
const db = new AxioDB();

// Create a new database
db.createDB("myDatabase").then(async (database) => {
  // Define a schema
  const userSchema = {
    name: SchemaTypes.string().required(),
    age: SchemaTypes.number().required(),
  };

  // Create a new collection with schema
  const users = await database.createCollection("users", userSchema);

  // Insert a document
  users.insert({ name: "John Doe", age: 30 }).then((response) => {
    console.log("Insert Response:", response);
  });

  // Query documents
  users
    .query({ age: { $gt: 25 } })
    .exac()
    .then((response) => {
      console.log("Query Response:", response);
    });
});
```

### ES6

```js
import { AxioDB, schemaValidate, SchemaTypes } from "axiodb";

// Initialize AxioDB
const db = new AxioDB();

// Create a new database
db.createDB("myDatabase").then(async (database) => {
  // Define a schema
  const userSchema = {
    name: SchemaTypes.string().required(),
    age: SchemaTypes.number().required(),
  };

  // Create a new collection with schema
  const users = await database.createCollection("users", userSchema);

  // Insert a document
  users.insert({ name: "John Doe", age: 30 }).then((response) => {
    console.log("Insert Response:", response);
  });

  // Query documents
  users
    .query({ age: { $gt: 25 } })
    .exac()
    .then((response) => {
      console.log("Query Response:", response);
    });
});
```

### Additional Features

#### Creating Multiple Databases and Collections & Deletations of Database

```js
const { AxioDB, SchemaTypes } = require("axiodb");

const db = new AxioDB();

const insertCode = async () => {
  const schema = {
    name: SchemaTypes.string().required().max(15),
    age: SchemaTypes.number().required().min(18),
  };

  const DB1 = await db.createDB("DB1");
  const DB2 = await db.createDB("DB2");
  const collection = await DB1.createCollection(
    "collection1",
    schema,
    true,
    "Ankan",
  );
  const collection2 = await DB1.createCollection("collection2", schema, false);

  // Insert data
  for (let i = 0; i < 300; i++) {
    await collection
      .insert({
        name: `Ankan${i}`,
        age: i + 18,
      })
      .then((data) => {
        console.log(data);
        collection
          .insert({
            name: `Saha${i}`,
            age: i + 18,
          })
          .then(console.log);
      });
  }

  // Query data
  collection
    .query({})
    .Sort({ age: -1 })
    .Skip(2)
    .Limit(10)
    .exec()
    .then(console.log);

  // Delete collection
  DB1.deleteCollection("collection1").then(console.log);

  // Get collection info
  DB1.getCollectionInfo().then(console.log);

  // Delete databases
  db.deleteDatabase("DB2").then(console.log);
  db.deleteDatabase("DB1").then(console.log);
};

insertCode();
```

## Encryption

AxioDB supports optional encryption to protect sensitive data stored in your JSON files. You can enable encryption when creating a collection by passing the `crypto` flag and an encryption key.

### Example with Encryption

```js
import { AxioDB, SchemaTypes } from "axiodb";

// Initialize AxioDB
const db = new AxioDB();

// Create a new database
db.createDB("myDatabase").then(async (database) => {
  // Define a schema
  const userSchema = {
    name: SchemaTypes.string().required(),
    age: SchemaTypes.number().required(),
  };

  // Create a new collection with schema and encryption
  const users = await database.createCollection(
    "users",
    userSchema,
    true,
    "mySecretKey",
  );

  // Insert a document
  users.insert({ name: "John Doe", age: 30 }).then((response) => {
    console.log("Insert Response:", response);
  });

  // Query documents
  users
    .query({ age: { $gt: 25 } })
    .exac()
    .then((response) => {
      console.log("Query Response:", response);
    });
});
```

## Motivation

As a MERN Stack Developer, I encountered several challenges with existing database solutions:

1. **Complex Setup:** Many databases require complex setup and configuration, which can be time-consuming and error-prone.
2. **Performance Bottlenecks:** Handling large datasets efficiently was often a challenge, especially with traditional databases.
3. **Flexibility:** I needed a flexible solution that could easily adapt to different project requirements without extensive modifications.
4. **Security:** Ensuring data security and encryption was crucial, but existing solutions often lacked easy-to-implement encryption features.

These pain points motivated me to develop AxioDB, a DBMS Npm Package that addresses these issues by providing a simple, efficient, and secure database solution for modern applications.

## Development Status

**Note:** This project is currently in development mode and is not stable. Features and APIs may change, and there may be bugs. Use it at your own risk and contribute to its development if possible.

## API Reference

### AxioDB

- **createDB(dbName: string): Promise<Database>**

  - Creates a new database with the specified name.

- **deleteDatabase(dbName: string): Promise<SuccessInterface | ErrorInterface>**
  - Deletes the specified database.

### Database

- **createCollection(collectionName: string, schema: object, crypto?: boolean, key?: string): Promise<Collection>**

  - Creates a new collection with the specified name and schema.

- **deleteCollection(collectionName: string): Promise<SuccessInterface | ErrorInterface>**

  - Deletes the specified collection from the database.

- **getCollectionInfo(): Promise<SuccessInterface>**
  - Retrieves information about all collections in the database.

### Collection

- **insert(data: object): Promise<SuccessInterface | ErrorInterface>**

  - Inserts a document into the collection.

- **query(query: object): Reader**
  - Queries documents in the collection.

### Reader

- **exac(callback?: Function): Promise<SuccessInterface | ErrorInterface>**

  - Executes the query and returns the results.

- **Limit(limit: number): Reader**

  - Sets a limit on the number of documents to return.

- **Skip(skip: number): Reader**

  - Sets the number of documents to skip.

- **Sort(sort: object): Reader**
  - Sets the sort order for the query.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors and supporters of this project.
