import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import Seo from "../ui/Seo";

interface ApiSection {
  title: string;
  methods: ApiMethod[];
}

interface ApiMethod {
  name: string;
  signature: string;
  description: string;
  example?: string;
  returns: string;
}

const ApiReference: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedMethods, setExpandedMethods] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const toggleMethod = (method: string) => {
    setExpandedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  };

  // API Sections definition
  const apiSections: ApiSection[] = [
    {
      title: "AxioDB (Main Instance)",
      methods: [
        {
          name: "constructor",
          signature: "new AxioDB(options?: { GUI?: boolean, HTTP?: boolean, RootName?: string, CustomPath?: string, TCP?: boolean, TCPAuth?: boolean })",
          description: "Creates a new AxioDB instance using an options object. This is the main entry point for AxioDB. Only one instance is allowed per application (singleton pattern). The GUI option enables/disables the web-based GUI dashboard at localhost:27018. HTTP enables the HTTP API server (auto-enables when GUI is on; GUI: true + HTTP: false throws error). TCP option enables the TCP server on port 27019. TCPAuth requires username/password authentication (same RBAC users as the GUI) for TCP connections - defaults to false.",
          example: `// Basic initialization with GUI enabled
const db = new AxioDB({ GUI: true });

// Custom root name and path
const db = new AxioDB({ GUI: true, RootName: 'MyCustomDB', CustomPath: './data' });

// GUI disabled, HTTP API only (no UI)
const db = new AxioDB({ GUI: false, HTTP: true });

// GUI disabled, no HTTP server
const db = new AxioDB({ GUI: false });

// TCP server with authentication required
const db = new AxioDB({ TCP: true, TCPAuth: true, RootName: 'MyDB', CustomPath: './data' });`,
          returns: "AxioDB: The AxioDB instance for managing databases.",
        },
        {
          name: "createDB",
          signature: "createDB(DBName: string): Promise<Database>",
          description: "Creates a new database within AxioDB. If the database already exists, it returns the existing database instance. Each database acts as a container for collections.",
          example: `// Create a new database
const myDB = await db.createDB('UserDatabase');

// Create multiple databases
const productsDB = await db.createDB('Products');
const ordersDB = await db.createDB('Orders');`,
          returns: "Promise<Database>: A promise that resolves to a Database instance.",
        },
        {
          name: "getInstanceInfo",
          signature: "getInstanceInfo(): Promise<SuccessInterface>",
          description: "Retrieves comprehensive information about the AxioDB instance, including total databases, total size, current path, and list of all databases. Useful for monitoring and dashboard displays.",
          example: `// Get instance information
const info = await db.getInstanceInfo();
console.log(info.data);
// Output: { CurrentPath, RootName, TotalSize, TotalDatabases, Databases: [...] }`,
          returns: "Promise<SuccessInterface>: A promise with instance metadata including size and database list.",
        },
      ],
    },
    {
      title: "Database",
      methods: [
        {
          name: "createCollection",
          signature: "createCollection(collectionName: string): Promise<Collection>",
          description: "Creates a new collection within the database. Collections store documents (JSON objects). No schema validation required - store any JSON structure.",
          example: `// Create a collection
const users = await myDB.createCollection('users');`,
          returns: "Promise<Collection>: A promise that resolves to a Collection instance.",
        },
        {
          name: "isCollectionExists",
          signature: "isCollectionExists(collectionName: string): Promise<boolean>",
          description: "Checks if a collection exists in the database. Returns true if the collection exists, false otherwise. Useful for conditional logic before creating or accessing collections.",
          example: `// Check before creating
if (await myDB.isCollectionExists('users')) {
  console.log('Users collection already exists');
} else {
  await myDB.createCollection('users');
}`,
          returns: "Promise<boolean>: True if collection exists, false otherwise.",
        },
        {
          name: "deleteCollection",
          signature: "deleteCollection(collectionName: string): Promise<SuccessInterface | ErrorInterface>",
          description: "Permanently deletes a collection and all its documents from the database. This operation cannot be undone. Use with caution in production environments.",
          example: `// Delete a collection
const result = await myDB.deleteCollection('oldData');
if (result.statusCode === 200) {
  console.log('Collection deleted successfully');
}`,
          returns: "Promise<SuccessInterface | ErrorInterface>: Success or error response.",
        },
        {
          name: "getCollectionInfo",
          signature: "getCollectionInfo(): Promise<SuccessInterface | ErrorInterface>",
          description: "Retrieves detailed information about all collections in the database, including collection names, paths, document counts, and total size. Perfect for building admin dashboards.",
          example: `// Get all collections info
const info = await myDB.getCollectionInfo();
console.log(\`Total collections: \${info.data.totalCollections}\`);
console.log(\`Total size: \${info.data.totalSize} bytes\`);`,
          returns: "Promise<SuccessInterface>: Comprehensive collection metadata and statistics.",
        },
      ],
    },
    {
      title: "Collection - Insert Operations",
      methods: [
        {
          name: "insert",
          signature: "insert(document: object): Promise<SuccessInterface | ErrorInterface>",
          description: "Inserts a single document into the collection. The document must be a valid JavaScript object. AxioDB automatically adds a unique documentId and updatedAt timestamp. AxioDB is schema-less - any JSON structure is accepted.",
          example: `// Insert a single document
const result = await collection.insert({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  active: true
});

console.log(result.data.documentId); // Auto-generated unique ID

// With nested objects
await collection.insert({
  name: 'Jane Smith',
  address: {
    street: '123 Main St',
    city: 'New York',
    zip: '10001'
  },
  tags: ['premium', 'verified']
});`,
          returns: "Promise<SuccessInterface | ErrorInterface>: Success response with documentId or error details.",
        },
        {
          name: "insertMany",
          signature: "insertMany(documents: object[] | object): Promise<SuccessInterface | ErrorInterface>",
          description: "Efficiently inserts multiple documents in a single operation. Accepts either an array of documents or a single document. Returns the total count and array of generated documentIds. Ideal for bulk data imports.",
          example: `// Insert multiple documents
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 35 }
];

const result = await collection.insertMany(users);
console.log(\`Inserted \${result.data.total} documents\`);
console.log(result.data.documentIds); // Array of IDs`,
          returns: "Promise<SuccessInterface>: Total inserted count and array of documentIds.",
        },
        {
          name: "totalDocuments",
          signature: "totalDocuments(): Promise<SuccessInterface | ErrorInterface>",
          description: "Returns the total count of documents in the collection. Fast operation that doesn't load document contents into memory. Useful for pagination and statistics.",
          example: `// Get document count
const result = await collection.totalDocuments();
console.log(\`Total documents: \${result.data.total}\`);

// Use for pagination
const pageSize = 10;
const totalPages = Math.ceil(result.data.total / pageSize);`,
          returns: "Promise<SuccessInterface>: Object containing the total document count.",
        },
        {
          name: "findByIds",
          signature: "findByIds(ids: string[]): Promise<SuccessInterface | ErrorInterface>",
          description: "Batch-read: fetch multiple documents by their IDs in one call (O(1) per id, missing ids silently omitted). Faster than N separate query({documentId}) calls and avoids cache churn.",
          example: `// Batch-read 3 documents
const batch = await users.findByIds(['id1','id2','id3']); // → { statusCode: 200, data: { documents: [...] } }
console.log(batch.data.documents);`,
          returns: "Promise<SuccessInterface>: Object with data.documents array (missing ids omitted).",
        },
        {
          name: "newIndex",
          signature: "newIndex(...fields: string[]): Promise<SuccessInterface | ErrorInterface>",
          description: "Creates indexes on specified field(s) to dramatically improve query performance. Indexes optimize lookups, range queries, sorting, and filtering operations on the indexed fields. Essential for collections with large datasets or frequent queries. Multiple fields can be indexed simultaneously for compound queries. Requires no server restart.",
          example: `// Create single field index
await users.newIndex('email');

// Create multiple field indexes
await users.newIndex('name', 'age', 'email');

// Indexes improve performance for:
// - Exact matches: query({ email: 'user@example.com' })
// - Range queries: query({ age: { $gte: 25, $lte: 35 } })
// - Sorting: query({}).Sort({ age: 1, name: 1 })
// - Regex searches: query({ email: { $regex: /@example.com$/ } })
// - Multi-field queries: query({ name: 'John', age: 30 })

// Best practice: Create indexes after collection creation
const users = await db.createCollection('users');
await users.newIndex('email', 'age', 'createdAt');`,
          returns: "Promise<SuccessInterface>: Created index metadata (async dual-write).",
        },
        {
          name: "dropIndex",
          signature: "dropIndex(indexName: string): Promise<SuccessInterface | ErrorInterface>",
          description: "Removes an existing index by field name, deleting its index file and metadata entry. Use this to reclaim disk space or when a field no longer needs fast lookups.",
          example: `// Drop an index that's no longer needed
const result = await collection.dropIndex('email');
console.log(result.data); // "Index: email deleted successfully"`,
          returns: "Promise<SuccessInterface | ErrorInterface>: Success message, or an error if the index doesn't exist.",
        },
        {
          name: "getIndexes",
          signature: "getIndexes(): Promise<SuccessInterface | ErrorInterface>",
          description: "Lists every index currently registered on the collection. Useful for auditing which fields are indexed before adding new ones, or confirming a drop took effect.",
          example: `// List all indexes on a collection
const result = await collection.getIndexes();
console.log(result.data);
// [{ indexFieldName: 'email', fileName: 'email.axiodb', path: '...' }, ...]`,
          returns: "Promise<SuccessInterface>: Array of index metadata entries ({ indexFieldName, fileName, path }).",
        },
      ],
    },
    {
      title: "Collection - Query Operations (Reader)",
      methods: [
        {
          name: "query",
          signature: "query(query: object): Reader",
          description: "Initiates a query operation on the collection. Supports MongoDB-style query operators like $gt, $lt, $gte, $lte, $ne, $in, $regex, and more. Returns a Reader instance for chaining operations like sort, limit, skip, and projection.",
          example: `// Simple query
const results = await collection
  .query({ age: 30 })
  .exec();

// Using operators
const adults = await collection
  .query({ age: { $gte: 18 } })
  .exec();

// Complex query with AND conditions
const premiumUsers = await collection
  .query({
    age: { $gte: 25 },
    status: 'active',
    'address.city': 'New York'
  })
  .exec();

// Regex search
const emailSearch = await collection
  .query({
    email: { $regex: '@gmail.com$', $options: 'i' }
  })
  .exec();`,
          returns: "Reader: A Reader instance for chaining query operations.",
        },
        {
          name: "Limit",
          signature: "Limit(limit: number): Reader",
          description: "Limits the number of documents returned by the query. Essential for pagination and performance optimization when dealing with large collections.",
          example: `// Get first 10 documents
const results = await collection
  .query({})
  .Limit(10)
  .exec();

// Pagination - page 2 with 20 items per page
const page2 = await collection
  .query({})
  .Skip(20)
  .Limit(20)
  .exec();`,
          returns: "Reader: The Reader instance for further chaining.",
        },
        {
          name: "Skip",
          signature: "Skip(skip: number): Reader",
          description: "Skips a specified number of documents in the query results. Used in combination with Limit for pagination. Documents are skipped after sorting if Sort is applied.",
          example: `// Skip first 10, get next 10
const results = await collection
  .query({ active: true })
  .Skip(10)
  .Limit(10)
  .exec();

// Page 3 of results (20 per page)
const page = 3;
const pageSize = 20;
const pageResults = await collection
  .query({})
  .Skip((page - 1) * pageSize)
  .Limit(pageSize)
  .exec();`,
          returns: "Reader: The Reader instance for further chaining.",
        },
        {
          name: "Sort",
          signature: "Sort(sort: object): Reader",
          description: "Sorts the query results by one or more fields. Use 1 for ascending order and -1 for descending order. Multiple fields can be specified for multi-level sorting.",
          example: `// Sort by age descending
const results = await collection
  .query({})
  .Sort({ age: -1 })
  .exec();

// Multi-field sort: status ascending, then age descending
const sorted = await collection
  .query({})
  .Sort({ status: 1, age: -1 })
  .exec();

// Sort by name alphabetically
const alphabetical = await collection
  .query({})
  .Sort({ name: 1 })
  .Limit(50)
  .exec();`,
          returns: "Reader: The Reader instance for further chaining.",
        },
        {
          name: "setCount",
          signature: "setCount(count: boolean): Reader",
          description: "When enabled, returns only the count of matching documents instead of the actual documents. Significantly faster than loading all documents when you only need the count. Useful for 'showing X results' features.",
          example: `// Get count only
const countResult = await collection
  .query({ status: 'active' })
  .setCount(true)
  .exec();

console.log(\`Found \${countResult.data} active users\`);

// Count with complex query
const premiumCount = await collection
  .query({
    plan: 'premium',
    'subscription.endDate': { $gt: new Date() }
  })
  .setCount(true)
  .exec();`,
          returns: "Reader: The Reader instance for further chaining.",
        },
        {
          name: "setProject",
          signature: "setProject(project: object): Reader",
          description: "Specifies which fields to include (1) or exclude (0) from the returned documents. Reduces memory usage and network transfer when you only need specific fields. Similar to MongoDB projection.",
          example: `// Only return name and email
const results = await collection
  .query({})
  .setProject({ name: 1, email: 1 })
  .exec();

// Exclude sensitive fields
const publicData = await collection
  .query({})
  .setProject({ password: 0, ssn: 0 })
  .exec();

// Nested field projection
const addresses = await collection
  .query({})
  .setProject({ 'address.city': 1, 'address.zip': 1 })
  .exec();`,
          returns: "Reader: The Reader instance for further chaining.",
        },
        {
          name: "hint",
          signature: "hint(indexName: string): Reader",
          description: "Force the query planner to use a specific index (field name). Requires the index to already exist via newIndex(). Use for performance tuning when the auto-selected index is not optimal.",
          example: `// Force 'status' index
const active = await users.query({ status: 'active' }).hint('status').exec();

// With other chain ops
const page = await users.query({ age: { $gte: 18 } }).hint('age').Sort({ age: 1 }).Limit(20).exec();`,
          returns: "Reader: The Reader instance for further chaining.",
        },
        {
          name: "exec",
          signature: "exec(): Promise<SuccessInterface | ErrorInterface>",
          description: "Executes the query chain and returns the results. This must be the final method called in a query chain. The method loads matching documents from disk, applies all filters, sorting, and projections.",
          example: `// Complete query chain
const results = await collection
  .query({ age: { $gte: 18 } })
  .Sort({ age: -1 })
  .Limit(20)
  .setProject({ name: 1, age: 1, email: 1 })
  .exec();

// Handle results
if (results.statusCode === 200) {
  console.log(\`Found \${results.data.length} documents\`);
  results.data.forEach(doc => console.log(doc));
}`,
          returns: "Promise<SuccessInterface | ErrorInterface>: Query results or error.",
        },
      ],
    },
    {
      title: "Collection - Update Operations",
      methods: [
        {
          name: "update",
          signature: "update(query: object): UpdateOperation",
          description: "Initiates an update operation on documents matching the query. Returns an UpdateOperation instance that provides UpdateOne and UpdateMany methods. Automatically updates the 'updatedAt' timestamp.",
          example: `// Get update operation instance
const updater = collection.update({ name: 'John' });

// Then call UpdateOne or UpdateMany
await updater.UpdateOne({ age: 31 });`,
          returns: "UpdateOperation: An update operation instance for chaining.",
        },
        {
          name: "UpdateOne",
          signature: "UpdateOne(newData: object): Promise<SuccessInterface | ErrorInterface>",
          description: "Updates the first document matching the query. Only provided fields are updated; other fields remain unchanged. Returns both the new data and previous data for comparison. If Sort is applied, updates the first document after sorting.",
          example: `// Update single field
const result = await collection
  .update({ email: 'john@example.com' })
  .UpdateOne({ age: 31 });

console.log('Previous:', result.data.previousData);
console.log('Updated:', result.data.newData);

// Update multiple fields
await collection
  .update({ documentId: 'abc123' })
  .UpdateOne({
    status: 'active',
    lastLogin: new Date(),
    loginCount: 10
  });

// Update with Sort (updates oldest)
await collection
  .update({ status: 'pending' })
  .Sort({ createdAt: 1 })
  .UpdateOne({ status: 'processing' });`,
          returns: "Promise<SuccessInterface>: New data, previous data, and documentId.",
        },
        {
          name: "UpdateMany",
          signature: "UpdateMany(newData: object): Promise<SuccessInterface | ErrorInterface>",
          description: "Updates all documents matching the query. Efficient bulk update operation. Only specified fields are updated. Returns the count of updated documents and their IDs.",
          example: `// Update all matching documents
const result = await collection
  .update({ status: 'pending' })
  .UpdateMany({ status: 'active' });

console.log(\`Updated \${result.data.total} documents\`);

// Bulk status change
await collection
  .update({ 'subscription.expired': true })
  .UpdateMany({
    status: 'inactive',
    accessLevel: 'free'
  });

// Increment all values
await collection
  .update({ type: 'counter' })
  .UpdateMany({ views: 1 }); // Note: Not $inc, direct assignment`,
          returns: "Promise<SuccessInterface>: Total updated count and document IDs.",
        },
        {
          name: "Sort (in update)",
          signature: "Sort(sort: object): UpdateOperation",
          description: "Applies sorting before update operation. When used with UpdateOne, it determines which document gets updated. Useful for updating the oldest, newest, or highest/lowest value document.",
          example: `// Update oldest pending item
await collection
  .update({ status: 'pending' })
  .Sort({ createdAt: 1 })
  .UpdateOne({ status: 'processing' });

// Update highest priority task
await collection
  .update({ completed: false })
  .Sort({ priority: -1 })
  .UpdateOne({ status: 'in-progress' });`,
          returns: "UpdateOperation: The update operation instance for chaining.",
        },
      ],
    },
    {
      title: "Collection - Delete Operations",
      methods: [
        {
          name: "delete",
          signature: "delete(query: object): DeleteOperation",
          description: "Initiates a delete operation on documents matching the query. Returns a DeleteOperation instance that provides deleteOne and deleteMany methods. Deleted documents cannot be recovered.",
          example: `// Get delete operation instance
const deleter = collection.delete({ status: 'inactive' });

// Then call deleteOne or deleteMany
await deleter.deleteOne();`,
          returns: "DeleteOperation: A delete operation instance for chaining.",
        },
        {
          name: "deleteOne",
          signature: "deleteOne(): Promise<SuccessInterface | ErrorInterface>",
          description: "Deletes the first document matching the query. Returns the deleted document data for reference. If Sort is applied, deletes the first document after sorting. Use with caution as this operation is irreversible.",
          example: `// Delete single document
const result = await collection
  .delete({ email: 'old@example.com' })
  .deleteOne();

console.log('Deleted:', result.data.deleteData);

// Delete oldest record
await collection
  .delete({ type: 'temporary' })
  .Sort({ createdAt: 1 })
  .deleteOne();

// Delete by documentId
await collection
  .delete({ documentId: 'abc123' })
  .deleteOne();`,
          returns: "Promise<SuccessInterface>: The deleted document data.",
        },
        {
          name: "deleteMany",
          signature: "deleteMany(): Promise<SuccessInterface | ErrorInterface>",
          description: "Deletes all documents matching the query. Efficient bulk delete operation. Returns an array of all deleted documents for audit purposes. This operation is irreversible - use with extreme caution in production.",
          example: `// Delete all inactive users
const result = await collection
  .delete({ status: 'inactive' })
  .deleteMany();

console.log(\`Deleted \${result.data.deleteData.length} documents\`);

// Delete old records (older than 30 days)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await collection
  .delete({ createdAt: { $lt: thirtyDaysAgo } })
  .deleteMany();

// Clear test data
await collection
  .delete({ isTestData: true })
  .deleteMany();`,
          returns: "Promise<SuccessInterface>: Array of all deleted documents.",
        },
        {
          name: "Sort (in delete)",
          signature: "Sort(sort: object): DeleteOperation",
          description: "Applies sorting before delete operation. When used with deleteOne, it determines which document gets deleted first. Useful for deleting oldest entries, lowest priority items, etc.",
          example: `// Delete oldest entry
await collection
  .delete({ type: 'log' })
  .Sort({ timestamp: 1 })
  .deleteOne();

// Delete lowest scored item
await collection
  .delete({ completed: false })
  .Sort({ score: 1 })
  .deleteOne();`,
          returns: "DeleteOperation: The delete operation instance for chaining.",
        },
      ],
    },
    {
      title: "Collection - Aggregation Operations",
      methods: [
        {
          name: "aggregate",
          signature: "aggregate(pipeline: object[]): Aggregation",
          description: "Initiates an aggregation operation with a MongoDB-compatible pipeline. Supports 60+ stages including $lookup (cross-collection joins), $facet, $bucket, $count, $sample, and full expression evaluator. Custom operators can be registered via OperatorRegistry.",
          example: `// Basic aggregation pipeline
const result = await collection
  .aggregate([
    { $match: { age: { $gte: 18 } } },
    { $group: { _id: '$city', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  .exec();

// Cross-collection join with $lookup
const usersWithOrders = await collection.aggregate([
  { $lookup: {
      from: 'Orders',
      localField: 'userId',
      foreignField: 'userId',
      as: 'userOrders'
  }},
  { $unwind: '$userOrders' },
  { $group: { _id: '$name', totalSpent: { $sum: '$userOrders.total' } } }
]).exec();`,
          returns: "Aggregation: An aggregation operation instance.",
        },
        {
          name: "$match",
          signature: "{ $match: { field: value } }",
          description: "Filters documents. Supports $and, $or, $nor, $not, $exists, $elemMatch, $all, $size, $type, $mod, $regex/$options, and comparison operators. No longer required as the first stage.",
          example: `// Logical operators
await collection.aggregate([
  { $match: { $or: [{ status: 'active' }, { age: { $gt: 30 } }] } }
]).exec();

// $exists and $type
await collection.aggregate([
  { $match: { email: { $exists: true }, age: { $type: 'number' } } }
]).exec();`,
          returns: "Pipeline stage: Filtered documents.",
        },
        {
          name: "$group",
          signature: "{ $group: { _id: '$field', aggField: { $operator: '$field' } } }",
          description: "Groups documents by _id (literal, field path, or composite object). Accumulators: $sum, $avg, $min, $max, $first, $last, $push, $addToSet, $stdDevPop, $stdDevSamp.",
          example: `// All accumulators
await collection.aggregate([
  { $group: {
    _id: '$department',
    total: { $sum: '$salary' },
    avg: { $avg: '$salary' },
    min: { $min: '$salary' },
    max: { $max: '$salary' },
    names: { $push: '$name' },
    uniqueRoles: { $addToSet: '$role' }
  }}
]).exec();`,
          returns: "Pipeline stage: Grouped documents with aggregated values.",
        },
        {
          name: "$sort",
          signature: "{ $sort: { field: 1 | -1, ... } }",
          description: "Sorts documents. Multi-field support — first field wins on ties.",
          example: `await collection.aggregate([
  { $sort: { department: 1, salary: -1 } }
]).exec();`,
          returns: "Pipeline stage: Sorted documents.",
        },
        {
          name: "$project",
          signature: "{ $project: { field: 1 | 0 | expression } }",
          description: "Reshapes documents. Inclusion (1), exclusion (0), or computed fields via expressions.",
          example: `// Computed fields
await collection.aggregate([
  { $project: {
    name: 1,
    bonus: { $multiply: ['$salary', 0.1] },
    level: { $cond: { if: { $gte: ['$age', 35] }, then: 'Senior', else: 'Junior' } }
  }}
]).exec();`,
          returns: "Pipeline stage: Projected documents.",
        },
        {
          name: "$lookup",
          signature: "{ $lookup: { from, localField, foreignField, as } }",
          description: "Cross-collection join. Equality form joins on matching fields. Pipeline form supports $let/$$var binding and sub-pipeline filtering. Uses index optimization on foreign collection when indexes exist.",
          example: `// Equality join
await collection.aggregate([
  { $lookup: {
      from: 'Orders',
      localField: 'userId',
      foreignField: 'userId',
      as: 'userOrders'
  }}
]).exec();

// Pipeline join with conditions
await collection.aggregate([
  { $lookup: {
      from: 'Orders',
      let: { uid: '$userId' },
      pipeline: [
        { $match: { status: 'completed' } },
        { $match: { $expr: { $eq: ['$userId', '$$uid'] } } }
      ],
      as: 'completedOrders'
  }}
]).exec();`,
          returns: "Pipeline stage: Documents with joined array field.",
        },
        {
          name: "$facet",
          signature: "{ $facet: { key: [pipeline], ... } }",
          description: "Runs multiple sub-pipelines in parallel on the same input.",
          example: `await collection.aggregate([
  { $facet: {
    byDepartment: [{ $group: { _id: '$dept', count: { $sum: 1 } } }],
    seniors: [{ $match: { age: { $gte: 35 } } }, { $count: 'count' }],
    avgSalary: [{ $group: { _id: null, avg: { $avg: '$salary' } } }]
  }}
]).exec();`,
          returns: "Single document with arrays for each facet.",
        },
        {
          name: "$limit",
          signature: "{ $limit: number }",
          description: "Limits the number of documents in the pipeline.",
          example: `await collection.aggregate([
  { $group: { _id: '$city', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]).exec();`,
          returns: "Pipeline stage: Limited number of documents.",
        },
        {
          name: "$skip",
          signature: "{ $skip: number }",
          description: "Skips a specified number of documents. Used for pagination.",
          example: `await collection.aggregate([
  { $sort: { createdAt: -1 } },
  { $skip: 20 },
  { $limit: 10 }
]).exec();`,
          returns: "Pipeline stage: Documents after skipping.",
        },
        {
          name: "$unwind",
          signature: "{ $unwind: '$field' | { path, includeArrayIndex, preserveNullAndEmptyArrays } }",
          description: "Deconstructs an array field. Supports includeArrayIndex and preserveNullAndEmptyArrays options.",
          example: `await collection.aggregate([
  { $unwind: { path: '$tags', includeArrayIndex: 'tagIndex' } }
]).exec();`,
          returns: "Pipeline stage: Unwound documents.",
        },
        {
          name: "$addFields / $set",
          signature: "{ $addFields: { field: expression } }",
          description: "Adds computed fields via expressions. $set is an alias.",
          example: `await collection.aggregate([
  { $addFields: {
    annualBonus: { $multiply: ['$salary', 0.1] },
    fullName: { $concat: ['$firstName', ' ', '$lastName'] }
  }}
]).exec();`,
          returns: "Pipeline stage: Documents with added fields.",
        },
        {
          name: "$count",
          signature: "{ $count: 'fieldName' }",
          description: "Counts documents and assigns the count to a named field.",
          example: `await collection.aggregate([
  { $match: { active: true } },
  { $count: 'activeUsers' }
]).exec();`,
          returns: "Single document with the count.",
        },
        {
          name: "$bucket / $bucketAuto",
          signature: "{ $bucket: { groupBy, boundaries, output } }",
          description: "Groups documents into buckets. $bucket uses explicit boundaries, $bucketAuto distributes evenly.",
          example: `await collection.aggregate([
  { $bucket: {
    groupBy: '$age',
    boundaries: [20, 30, 40, 50],
    output: { count: { $sum: 1 }, names: { $push: '$name' } }
  }}
]).exec();`,
          returns: "Array of bucket documents.",
        },
        {
          name: "OperatorRegistry",
          signature: "OperatorRegistry.registerStageOperator(name, fn)",
          description: "Register custom stage operators, accumulators, and expression operators that extend the aggregation engine.",
          example: `import { OperatorRegistry } from 'axiodb';

OperatorRegistry.registerAccumulator('$median', (collection, expr) => {
  const values = collection.map(doc => doc[expr.field]).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
});

await collection.aggregate([
  { $group: { _id: '$dept', medianSalary: { $median: { field: 'salary' } } } }
]).exec();`,
          returns: "void",
        },
        {
          name: "exec (aggregation)",
          signature: "exec(): Promise<SuccessInterface | ErrorInterface>",
          description: "Executes the aggregation pipeline and returns the results.",
          example: `const stats = await collection.aggregate([
  { $match: { status: 'active' } },
  { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
  { $sort: { avgSalary: -1 } },
  { $limit: 5 }
]).exec();`,
          returns: "Promise<SuccessInterface>: Aggregation results or error.",
        },
      ],
    },
    {
      title: "Collection - Transaction Operations",
      methods: [
        {
          name: "beginTransaction",
          signature: "beginTransaction(): Transaction",
          description: "Starts a new transaction for atomic operations. All operations within a transaction are isolated and can be committed together or rolled back if any operation fails. Provides ACID-like guarantees for multiple operations.",
          example: `// Start a transaction
const transaction = collection.beginTransaction();

// Operations within transaction are isolated
await transaction.insert({ name: 'Alice', balance: 1000 });
await transaction.insert({ name: 'Bob', balance: 500 });

// Commit all changes atomically
await transaction.commit();`,
          returns: "Transaction: A transaction instance for chaining operations.",
        },
        {
          name: "transaction.insert",
          signature: "transaction.insert(document: object): Transaction",
          description: "Inserts a document within the transaction context. The document is staged but not persisted until commit() is called. If rollback() is called, this insert will be discarded.",
          example: `const transaction = collection.beginTransaction();

// Insert multiple documents in transaction
await transaction.insert({ type: 'debit', amount: 100 });
await transaction.insert({ type: 'credit', amount: 100 });

await transaction.commit();`,
          returns: "Promise<SuccessInterface>: Success or error response.",
        },
        {
          name: "transaction.update",
          signature: "transaction.update(query: object, update: object): Transaction",
          description: "Updates documents matching the query within the transaction. Changes are staged until commit(). Original values are preserved for potential rollback.",
          example: `const transaction = collection.beginTransaction();

// Transfer funds between accounts
await transaction.update(
  { accountId: 'A123' },
    { balance: 500 }
);
await transaction.update(
  { accountId: 'B456' },
    { balance: 1500 }
);

await transaction.commit();`,
          returns: "Promise<SuccessInterface>: Success or error response.",
        },
        {
          name: "transaction.delete",
          signature: "transaction.delete(query: object): Transaction",
          description: "Deletes documents matching the query within the transaction. Deletion is staged until commit(). Documents are preserved for potential rollback.",
          example: `const transaction = collection.beginTransaction();

// Delete and log in single transaction
await transaction.delete({ status: 'expired' });
await transaction.insert({
  type: 'audit',
  action: 'cleanup',
  timestamp: Date.now()
});

await transaction.commit();`,
          returns: "Promise<SuccessInterface>: Success or error response.",
        },
        {
          name: "transaction.commit",
          signature: "commit(): Promise<SuccessInterface>",
          description: "Commits all staged operations in the transaction atomically. If any operation fails during commit, all changes are automatically rolled back. After commit, the transaction cannot be reused.",
          example: `const transaction = collection.beginTransaction();

try {
  await transaction.insert({ orderId: 'ORD001', total: 299.99 });
  await transaction.update(
    { productId: 'PROD001' },
    { stock: 9 }
  );
  
  // Commit all changes
  const result = await transaction.commit();
  console.log('Transaction committed:', result.status);
} catch (error) {
  console.error('Transaction failed:', error);
}`,
          returns: "Promise<SuccessInterface>: Commit result with status.",
        },
        {
          name: "transaction.rollback",
          signature: "rollback(): Promise<SuccessInterface>",
          description: "Discards all staged operations and restores the collection to its state before the transaction began. Use this when you need to cancel operations due to validation failures or business logic conditions.",
          example: `const transaction = collection.beginTransaction();

await transaction.update(
  { accountId: 'sender' },
  { $inc: { balance: -1000 } }
);

// Check if sender has sufficient balance
const sender = await collection.query({ accountId: 'sender' }).findOne();
if (sender.data.balance < 0) {
  // Rollback if insufficient funds
  await transaction.rollback();
  console.log('Transaction rolled back: Insufficient funds');
  return;
}

await transaction.commit();`,
          returns: "Promise<SuccessInterface>: Rollback confirmation.",
        },
      ],
    },
  ];

  return (
    <section id="api-reference" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB API Reference - Complete JavaScript/TypeScript Documentation"
        description="Complete SDK API reference for AxioDB: Database, Collection, Reader, Aggregation, and Transaction classes with method signatures and examples."
        path="/api-reference"
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-accent-200 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent-500 rounded-xl shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                Complete API Reference
              </h1>
              <p className="text-xl text-gray-600 font-light mt-2">
                Comprehensive documentation with examples for every method
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-600 leading-relaxed">
              This API reference provides detailed documentation for all AxioDB classes, methods, and operations.
              Each method includes type signatures, descriptions, practical examples, and return value specifications.
            </p>

            {/* Quick Navigation Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-accent-100/30 rounded-lg p-4 border border-accent-200">
                <h3 className="font-semibold text-accent-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🚀</span> Getting Started
                </h3>
                <p className="text-sm text-accent-600">
                  Start with <code className="bg-accent-100 text-accent-800 px-1 rounded">AxioDB</code> and <code className="bg-accent-100 text-accent-800 px-1 rounded">Database</code> sections
                </p>
              </div>

              <div className="bg-green-100/30 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">📝</span> CRUD Operations
                </h3>
                <p className="text-sm text-green-700">
                  See <code className="bg-green-100 text-green-800 px-1 rounded">Insert</code>, <code className="bg-green-100 text-green-800 px-1 rounded">Query</code>, <code className="bg-green-100 text-green-800 px-1 rounded">Update</code>, <code className="bg-green-100 text-green-800 px-1 rounded">Delete</code> sections
                </p>
              </div>

              <div className="bg-purple-100/30 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">📊</span> Advanced
                </h3>
                <p className="text-sm text-purple-700">
                  Explore <code className="bg-purple-100 text-purple-800 px-1 rounded">Aggregation</code> for complex data analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Sections */}
      <div className="space-y-6">
        {apiSections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <button
              className="flex items-center justify-between w-full p-4 text-left bg-gray-200 hover:bg-gray-300"
              onClick={() => toggleSection(section.title)}
            >
              <h3 className="text-xl font-semibold text-gray-900">
                {section.title}
              </h3>
              {expandedSections.includes(section.title) ? (
                <ChevronDown size={20} className="text-gray-600" />
              ) : (
                <ChevronRight size={20} className="text-gray-600" />
              )}
            </button>

            {expandedSections.includes(section.title) && (
              <div className="divide-y divide-gray-200">
                {section.methods.map((method) => (
                  <div key={`${section.title}-${method.name}`} className="p-4">
                    <button
                      className="flex items-center justify-between w-full text-left mb-2 gap-2"
                      onClick={() =>
                        toggleMethod(`${section.title}-${method.name}`)
                      }
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <span className="font-mono text-accent-600 font-medium truncate">
                          {method.name}
                        </span>
                      </div>
                      {expandedMethods.includes(
                        `${section.title}-${method.name}`,
                      ) ? (
                        <ChevronDown size={16} className="text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${expandedMethods.includes(
                        `${section.title}-${method.name}`,
                      )
                        ? "max-h-[500px]"
                        : "max-h-0"
                        }`}
                    >
                      <div className="pt-2 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-1">
                            Signature
                          </h4>
                          <pre className="bg-white p-2 rounded-md text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                            <code className="text-sm font-mono">
                              {method.signature}
                            </code>
                          </pre>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-1">
                            Description
                          </h4>
                          <p className="text-gray-600">
                            {method.description}
                          </p>
                        </div>

                        {method.example && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-1">
                              Example
                            </h4>
                            <pre className="bg-white p-2 rounded-md text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                              <code className="text-sm font-mono">
                                {method.example}
                              </code>
                            </pre>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-1">
                            Returns
                          </h4>
                          <p className="text-gray-600">
                            {method.returns}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enhanced Footer Section */}
      <div className="mt-12 space-y-6">
        {/* Query Operators Reference Card */}
        <div className="bg-orange-50 rounded-lg p-6 border border-amber-200">
          <h3 className="text-xl font-bold text-amber-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔍</span> Query Operators Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-amber-700 mb-2">Comparison</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$gt</code> - Greater than</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$gte</code> - Greater or equal</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$lt</code> - Less than</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$lte</code> - Less or equal</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$ne</code> - Not equal</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-700 mb-2">Logical</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$in</code> - Match any value</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$nin</code> - Not in array</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$and</code> - All conditions</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$or</code> - Any condition</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-700 mb-2">String</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$regex</code> - Pattern matching</li>
                <li><code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">$options</code> - Regex flags (i, g)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Response Interface Info */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">📦</span> Response Interface Structure
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Success Response</h4>
              <pre className="bg-green-100/50 p-2 sm:p-3 rounded-md text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                <code className="text-green-700">{`{
  statusCode: 200,
  status: 'success',
  message: 'Operation successful',
  data: { /* your data here */ }
}`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Error Response</h4>
              <pre className="bg-green-100/50 p-2 sm:p-3 rounded-md text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                <code className="text-green-700">{`{
  statusCode: 400,
  status: 'error',
  message: 'Error description',
  error: { /* error details */ }
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-accent-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Best Practices & Tips
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-purple-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-700 mt-0.5">✓</span>
              <span className="text-sm">Always use <code className="bg-purple-100 text-purple-800 px-1 rounded">try-catch</code> blocks for async operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-700 mt-0.5">✓</span>
              <span className="text-sm">Use <code className="bg-purple-100 text-purple-800 px-1 rounded">setProject()</code> to limit returned fields for better performance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-700 mt-0.5">✓</span>
              <span className="text-sm">Use <code className="bg-purple-100 text-purple-800 px-1 rounded">setCount(true)</code> instead of loading all docs when you only need the count</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-700 mt-0.5">✓</span>
              <span className="text-sm">Place <code className="bg-purple-100 text-purple-800 px-1 rounded">$match</code> early in aggregation pipelines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-700 mt-0.5">✓</span>
              <span className="text-sm">Use <code className="bg-purple-100 text-purple-800 px-1 rounded">documentId</code> queries for fastest lookups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-700 mt-0.5">✓</span>
              <span className="text-sm">Use <code className="bg-purple-100 text-purple-800 px-1 rounded">insertMany()</code> for bulk operations</span>
            </li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="bg-accent-100/20 rounded-lg p-6 border border-accent-200">
          <p className="text-gray-600 flex items-center gap-2">
            <span className="text-accent-600 text-xl">ℹ️</span>
            <span>
              This API reference is continuously updated with the latest features. All methods return Promises and support
              <code className="bg-accent-100 text-accent-800 px-2 py-0.5 rounded mx-1">async/await</code>
              syntax. For more examples and tutorials, check the
              <a href="/usage" className="text-accent-600 hover:underline mx-1 font-semibold">Usage Guide</a>
              and
              <a href="/advanced-features" className="text-accent-600 hover:underline mx-1 font-semibold">Advanced Features</a>
              sections.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ApiReference;
