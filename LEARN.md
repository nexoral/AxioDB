# Learn AxioDB

Welcome to AxioDB! This guide will help you get started with the embedded NoSQL database for Node.js.

[![npm version](https://badge.fury.io/js/axiodb.svg)](https://badge.fury.io/js/axiodb)

## What is AxioDB?

**AxioDB** is a pure JavaScript embedded database for Node.js—think SQLite, but NoSQL with MongoDB-style queries. Zero native dependencies, no compilation, no platform issues.

### Perfect For

- 🖥️ **Desktop Applications**: Electron, Tauri apps
- 🛠️ **CLI Tools**: Command-line applications needing local storage
- 📦 **Embedded Systems**: IoT devices, edge computing
- 🚀 **Rapid Prototyping**: Quick development without database setup
- 🏠 **Local-First Apps**: Applications prioritizing local data storage

### Sweet Spot

**10K-500K documents** with intelligent caching and sub-millisecond queries.

---

## Installation

```bash
npm install axiodb@latest --save
```

**Requirements:**
- Node.js >= 20.0.0
- npm >= 6.0.0

---

## Quick Start

### Hello World in 30 Seconds

```javascript
const { AxioDB } = require('axiodb');

// Create AxioDB instance with built-in GUI
const db = new AxioDB(true); // GUI at localhost:27018

// Create database and collection
const myDB = await db.createDB('HelloWorldDB');
const collection = await myDB.createCollection('greetings');

// Insert and retrieve data
await collection.insert({ message: 'Hello, Developer! 👋' });
const result = await collection.findAll();
console.log(result[0].message); // Hello, Developer! 👋
```

---

## Core Concepts

### 1. Single Instance Architecture

Create **one AxioDB instance** per application. Under this instance, you can create unlimited databases, collections, and documents.

```javascript
const { AxioDB } = require('axiodb');
const db = new AxioDB(); // Single instance for entire app
```

### 2. Databases

Databases are containers for collections. You can create multiple databases under one AxioDB instance.

```javascript
// Create database with schema validation (default)
const mainDB = await db.createDB('MainDatabase');

// Create database without schema validation
const logsDB = await db.createDB('LogsDatabase', false);
```

### 3. Collections

Collections store documents (like tables in SQL, but schema-less).

```javascript
// Create basic collection
const users = await mainDB.createCollection('users');

// Create encrypted collection with auto-generated key
const secureUsers = await mainDB.createCollection('secureUsers', true);

// Create encrypted collection with custom key
const vaultUsers = await mainDB.createCollection('vaultUsers', true, 'mySecretKey123');
```

### 4. Documents

Documents are JSON objects stored in collections.

```javascript
// Insert a document
await users.insert({
  name: 'Alice Johnson',
  email: 'alice@example.com',
  age: 28,
});
```

---

## CRUD Operations

### Create (Insert)

```javascript
// Insert single document
const result = await collection.insert({
  name: 'Bob Smith',
  email: 'bob@example.com',
  age: 35,
});

console.log(result.documentId); // Auto-generated ID
```

### Read (Query)

```javascript
// Find all documents
const allUsers = await collection.query({}).exec();

// Find with filters
const adults = await collection
  .query({ age: { $gt: 18 } })
  .exec();

// Chainable query methods
const results = await collection
  .query({ age: { $gt: 25 } })
  .Sort({ age: -1 })    // Sort descending
  .Limit(10)            // Limit to 10 results
  .Skip(0)              // Skip first 0
  .exec();

// Lightning-fast documentId lookup
const user = await collection
  .query({ documentId: 'ABC123XYZ' })
  .exec();
```

### Update

```javascript
// Update single document
await collection
  .update({ name: 'Bob Smith' })
  .UpdateOne({ age: 36 });

// Update multiple documents
await collection
  .update({ age: { $lt: 30 } })
  .UpdateMany({ status: 'young' });
```

### Delete

```javascript
// Delete single document
await collection
  .delete({ name: 'Bob Smith' })
  .deleteOne();

// Delete multiple documents
await collection
  .delete({ age: { $lt: 18 } })
  .deleteMany();
```

---

## Advanced Features

### Schema Validation

Define schemas to ensure data consistency:

```javascript
const { SchemaTypes } = require('axiodb');

const productSchema = {
  name: SchemaTypes.string().required().max(100),
  price: SchemaTypes.number().required().min(0),
  inStock: SchemaTypes.boolean().required(),
  tags: SchemaTypes.array(),
  metadata: SchemaTypes.object(),
};

const products = await db.createDB('shop')
  .then(db => db.createCollection('products', true, productSchema));
```

### Encryption

Protect sensitive data with AES-256 encryption:

```javascript
// With auto-generated key
const encrypted = await database.createCollection(
  'sensitiveData',
  true,
  schema,
  true  // Enable encryption
);

// With custom key (use environment variables!)
const encrypted = await database.createCollection(
  'sensitiveData',
  true,
  schema,
  true,
  process.env.ENCRYPTION_KEY  // Custom key
);
```

### Query Operators

AxioDB supports MongoDB-style query operators:

```javascript
// Comparison
{ age: { $gt: 25 } }           // Greater than
{ age: { $gte: 25 } }          // Greater than or equal
{ age: { $lt: 50 } }           // Less than
{ age: { $lte: 50 } }          // Less than or equal
{ age: { $ne: 30 } }           // Not equal

// Logical
{ age: { $in: [25, 30, 35] } } // In array
{ name: { $regex: 'John' } }   // Regex match

// Examples
const young = await collection.query({ age: { $lt: 30 } }).exec();
const specific = await collection.query({ age: { $in: [25, 30, 35] } }).exec();
const johns = await collection.query({ name: { $regex: 'John' } }).exec();
```

### Aggregation Pipelines

Perform complex data processing:

```javascript
const stats = await collection
  .aggregate([
    { $match: { age: { $gt: 20 } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ])
  .exec();
```

### Bulk Operations

Efficient operations on multiple documents:

```javascript
// Insert many
await collection.insertMany([
  { name: 'User 1', age: 25 },
  { name: 'User 2', age: 30 },
  { name: 'User 3', age: 35 },
]);

// Update many
await collection
  .update({ department: 'Sales' })
  .UpdateMany({ bonus: 1000 });

// Delete many
await collection
  .delete({ status: 'inactive' })
  .deleteMany();
```

---

## Built-in Web GUI

AxioDB includes a web-based GUI for database visualization:

```javascript
// Enable GUI when creating instance
const db = new AxioDB(true);  // GUI at localhost:27018
```

**GUI Features:**
- 📊 Visual database browser
- 🔍 Real-time data inspection
- 📝 Query execution
- 📈 Performance monitoring

Access at: `http://localhost:27018`

---

## Best Practices

### 1. Use Environment Variables for Secrets

❌ **Bad:**
```javascript
const collection = await db.createCollection('data', true, schema, true, 'myKey123');
```

✅ **Good:**
```javascript
const collection = await db.createCollection(
  'data',
  true,
  schema,
  true,
  process.env.AXIODB_ENCRYPTION_KEY
);
```

### 2. Use Schema Validation

```javascript
// Define strict schemas to prevent bad data
const schema = {
  email: SchemaTypes.string().required().email(),
  age: SchemaTypes.number().min(0).max(150),
};
```

### 3. Use documentId for Fast Lookups

```javascript
// O(1) lookup with InMemoryCache
const user = await collection.query({ documentId: 'ABC123' }).exec();
```

### 4. Implement Error Handling

```javascript
try {
  await collection.insert({ name: 'User' });
} catch (error) {
  console.error('Insert failed:', error);
}
```

### 5. Clean Up Resources

```javascript
// Delete unused collections
await database.deleteCollection('tempCollection');

// Delete unused databases
await db.deleteDatabase('tempDB');
```

---

## When NOT to Use AxioDB

AxioDB is **not suitable** for:

- ❌ **10M+ documents**: Use PostgreSQL, MongoDB, or SQLite
- ❌ **Distributed systems**: No replication or clustering
- ❌ **Complex relational data**: No JOIN operations
- ❌ **High-concurrency web apps**: Single-instance architecture
- ❌ **ACID transactions**: No multi-collection transactions

**For these cases**, migrate to:
- **PostgreSQL**: Relational data, ACID transactions
- **MongoDB**: Large-scale NoSQL, distributed systems
- **SQLite**: Massive datasets with SQL queries

---

## Examples

### E-Commerce Product Catalog

```javascript
const { AxioDB, SchemaTypes } = require('axiodb');
const db = new AxioDB();

const shopDB = await db.createDB('ecommerce');

const productSchema = {
  name: SchemaTypes.string().required(),
  price: SchemaTypes.number().required().min(0),
  category: SchemaTypes.string().required(),
  inStock: SchemaTypes.boolean().required(),
};

const products = await shopDB.createCollection('products', true, productSchema);

// Add products
await products.insert({
  name: 'Laptop',
  price: 999.99,
  category: 'Electronics',
  inStock: true,
});

// Query products
const electronics = await products
  .query({ category: 'Electronics', inStock: true })
  .Sort({ price: 1 })
  .exec();
```

### User Authentication System

```javascript
const userSchema = {
  username: SchemaTypes.string().required().min(3).max(20),
  email: SchemaTypes.string().required().email(),
  passwordHash: SchemaTypes.string().required(),
  createdAt: SchemaTypes.date(),
};

const users = await authDB.createCollection(
  'users',
  true,
  userSchema,
  true,  // Encrypted
  process.env.USER_ENCRYPTION_KEY
);

// Register user
await users.insert({
  username: 'johndoe',
  email: 'john@example.com',
  passwordHash: hashedPassword,
  createdAt: new Date(),
});

// Login
const user = await users
  .query({ username: 'johndoe' })
  .exec();
```

---

## Next Steps

- 📖 **[Full Documentation](https://axiodb.in/)**: Comprehensive guides
- 🐛 **[GitHub Issues](https://github.com/nexoral/AxioDB/issues)**: Report bugs
- 💬 **[Discussions](https://github.com/nexoral/AxioDB/discussions)**: Ask questions
- 🤝 **[Contributing](CONTRIBUTING.md)**: Contribute to AxioDB
- 🔒 **[Security](SECURITY.md)**: Security best practices

---

**Happy coding with AxioDB!** 🚀

Pure JavaScript. Zero dependencies. Blazing fast.
