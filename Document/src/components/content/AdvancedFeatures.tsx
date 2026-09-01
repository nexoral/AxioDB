import { Code, Database, GitBranch, RefreshCw, Rocket } from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import CodeBlock from "../ui/CodeBlock";
import Seo from "../ui/Seo";

const AdvancedFeatures: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>("multi-db");

  const featuresCode = {
    "multi-db": `const { AxioDB } = require("axiodb");

const Instance = new AxioDB({ GUI: true }); // Enable GUI
const CustomPathInstance = new AxioDB({ GUI: true, RootName: "NewDB", CustomPath: "./DB" });

const setup = async () => {
  // Create database
  const UserDB = await Instance.createDB("MyDB");

  // Create a collection
  const UserCollection = await UserDB.createCollection("Users");

  // Insert data with insertMany - no schema required
  await UserCollection.insertMany([
    { name: "John Doe", email: "john.doe@example.com", age: 30 },
    { name: "Jane Doe", email: "jane.doe@example.com", age: 25 },
    { name: "Alice Smith", email: "alice.smith@example.com", age: 28 }
  ]);

  // Complex query with all features
  const results = await UserCollection.query({
    email: { $in: ["john.doe@example.com", "jane.doe@example.com"] }
  }).Limit(10).Skip(2).Sort({ age: 1 }).findOne(true).setCount(true).setProject({
    _id: 1, name: 1, email: 1
  }).exec();
  console.log("Full Query Results:", results);

  // Fast retrieval by documentId
  const fastRes = await UserCollection.query({ documentId: "JOHTAOIJNHUJOBD"}).exec();
  console.log("Fast Retrieval:", fastRes);

  // Batch-read multiple IDs (O(1) per id)
  const batch = await UserCollection.findByIds(["id1","id2","id3"]);
  console.log("Batch:", batch.data.documents);

  // Force index via hint (requires newIndex first)
  await UserCollection.newIndex('status');
  const hinted = await UserCollection.query({ status: 'active' }).hint('status').exec();
  console.log("Hinted:", hinted);

  // Total count without loading docs
  const count = await UserCollection.totalDocuments();
  console.log("Total:", count.data.total);
};

setup();`,
    aggregation: `// Aggregation pipeline with multiple stages
const result = await UserCollection.aggregate([
  { $match: { age: { $gt: 25 } } },
  { $group: { _id: "$email", avgAge: { $avg: "$age" } } }
]).exec();

// Cross-collection join with $lookup
const usersWithOrders = await UserCollection.aggregate([
  { $lookup: {
      from: "Orders",
      localField: "userId",
      foreignField: "userId",
      as: "userOrders"
  }},
  { $unwind: "$userOrders" },
  { $group: { _id: "$name", totalSpent: { $sum: "$userOrders.total" } } },
  { $sort: { totalSpent: -1 } }
]).exec();

// Multi-facet aggregation
const facets = await UserCollection.aggregate([
  { $facet: {
    byDept: [{ $group: { _id: "$dept", count: { $sum: 1 } } }],
    seniors: [{ $match: { age: { $gte: 35 } } }, { $count: "count" }],
    avgSalary: [{ $group: { _id: null, avg: { $avg: "$salary" } } }]
  }}
]).exec();`,
    operations: `// Update operations with proper syntax
await UserCollection.update({name: "John Doe"}).UpdateOne({name: "Ankan"});
await UserCollection.update({name: "John Doe"}).UpdateMany({name: "Ankan", isActive: true});

// Update with complex queries
await UserCollection.update({ age: { $gt: 25 } }).UpdateMany({ category: "adult" });
await UserCollection.update({ email: { $regex: /example.com/ } }).UpdateOne({ verified: true });

// Delete operations
await UserCollection.delete({name: "John Doe"}).DeleteOne();
await UserCollection.delete({name: "John Doe"}).DeleteMany();

// Delete with complex queries
await UserCollection.delete({ age: { $lt: 18 } }).DeleteMany();
await UserCollection.delete({ email: { $regex: /temp/ } }).DeleteMany();

// Batch operations for better performance
const updateResult = await UserCollection.update({ age: { $gte: 18 } }).UpdateMany({ 
  status: "active", 
  lastUpdated: new Date().toISOString() 
});
console.log("Updated documents:", updateResult);`,
    indexing: `// Create indexes to dramatically improve query performance
const { AxioDB } = require("axiodb");

const Instance = new AxioDB({ GUI: true });
const UserDB = await Instance.createDB("MyDB");
const UserCollection = await UserDB.createCollection("Users");

// Create indexes on frequently queried fields
UserCollection.newIndex('email', 'age', 'name');

// Insert test data
await UserCollection.insertMany([
  { name: "John Doe", email: "john@example.com", age: 30 },
  { name: "Jane Smith", email: "jane@example.com", age: 25 },
  { name: "Bob Wilson", email: "bob@example.com", age: 35 }
]);

// These queries now benefit from indexes (faster performance):

// 1. Exact match on indexed field
const userByEmail = await UserCollection
  .query({ email: "john@example.com" })
  .exec();

// 2. Range query on indexed field
const adultUsers = await UserCollection
  .query({ age: { $gte: 25, $lte: 40 } })
  .exec();

// 3. Sorting on indexed field
const sortedUsers = await UserCollection
  .query({})
  .Sort({ age: 1, name: 1 })
  .exec();

// 4. Multi-field query using multiple indexes
const specificUsers = await UserCollection
  .query({
    age: { $gt: 25 },
    email: { $regex: /@example\\.com$/ }
  })
  .Sort({ age: -1 })
  .Limit(10)
  .exec();

// 5. Complex queries benefit from compound indexes
const complexQuery = await UserCollection
  .query({
    name: { $regex: /^J/ },
    age: { $gte: 20, $lte: 35 },
    email: { $regex: /example\\.com$/ }
  })
  .Sort({ age: 1, name: 1 })
  .Limit(100)
  .exec();

console.log("All indexed queries executed efficiently!");`,
    transactions: `// ACID-compliant transactions with savepoints and rollback
const { AxioDB } = require("axiodb");

const Instance = new AxioDB({ GUI: true });
const UserDB = await Instance.createDB("MyDB");
const UserCollection = await UserDB.createCollection("Users");

// Method 1: Using withTransaction (auto-commit/rollback)
const session = UserCollection.startSession();
await session.withTransaction(async (tx) => {
  await tx.insert({ name: "Alice", balance: 1000 });
  await tx.insert({ name: "Bob", balance: 500 });
  await tx.update({ name: "Alice" }, { balance: 900 });
  await tx.update({ name: "Bob" }, { balance: 600 });
  // Auto-commits on success, auto-rollbacks on error
});

// Method 2: Manual transaction control with savepoints
const transaction = UserCollection.startSession().startTransaction();

// Insert initial data
await transaction.insert({ name: "Charlie", balance: 1000 });
transaction.savepoint("after_charlie");

// Make more changes
await transaction.insert({ name: "David", balance: 500 });
await transaction.update({ name: "Charlie" }, { balance: 800 });

// Oops! Rollback to savepoint
transaction.rollbackToSavepoint("after_charlie");

// Continue with different changes
await transaction.insert({ name: "Eve", balance: 750 });

// Commit all changes
await transaction.commit();

console.log("Transaction completed successfully!");`,
  };

  return (
    <section id="advanced-features" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB Advanced Features - Aggregation, Multi-DB & Optimization"
        description="Advanced AxioDB features: aggregation pipelines, multi-database architecture, ACID transactions, and performance optimization."
        path="/advanced-features"
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 border border-purple-200 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                Advanced Database Features
              </h1>
              <p className="text-xl text-gray-600 font-light mt-2">
                Enterprise-grade capabilities for complex applications
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            Harness the full power of AxioDB with advanced features designed for
            enterprise applications. Our comprehensive suite includes
            multi-database management, sophisticated aggregation pipelines,
            and optimized CRUD operations that scale with your business
            requirements.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 justify-center lg:justify-start">
        <Button
          variant={activeFeature === "multi-db" ? "primary" : "outline"}
          onClick={() => setActiveFeature("multi-db")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <Database className="h-4 w-4 mr-2" />
          Multiple Databases
        </Button>
        <Button
          variant={activeFeature === "aggregation" ? "primary" : "outline"}
          onClick={() => setActiveFeature("aggregation")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggregation Pipelines
        </Button>
        <Button
          variant={activeFeature === "operations" ? "primary" : "outline"}
          onClick={() => setActiveFeature("operations")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <Code className="h-4 w-4 mr-2" />
          CRUD Operations
        </Button>
        <Button
          variant={activeFeature === "indexing" ? "primary" : "outline"}
          onClick={() => setActiveFeature("indexing")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <Rocket className="h-4 w-4 mr-2" />
          Performance Indexing
        </Button>
        <Button
          variant={activeFeature === "transactions" ? "primary" : "outline"}
          onClick={() => setActiveFeature("transactions")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Transactions
        </Button>
      </div>

      <div className="bg-gray-100 rounded-lg p-8 lg:p-10 shadow-md border border-gray-200 mb-12 transition-all duration-300 hover:shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-gray-900">
          {activeFeature === "multi-db" &&
            "Multi-Database Architecture & Collection Management"}
          {activeFeature === "aggregation" &&
            "Advanced Data Aggregation Pipelines"}
          {activeFeature === "operations" && "Sophisticated CRUD Operations"}
          {activeFeature === "indexing" &&
            "High-Performance Field Indexing"}
          {activeFeature === "transactions" &&
            "ACID-Compliant Transactions"}
        </h3>

        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {activeFeature === "multi-db" &&
            "Architect scalable applications with multiple databases and collections, each configured with independent security protocols and performance optimizations to meet diverse business requirements."}
          {activeFeature === "aggregation" &&
            "Execute complex data processing workflows using MongoDB-compatible aggregation pipelines, enabling sophisticated filtering, grouping, sorting, and transformation operations for business intelligence and analytics."}
          {activeFeature === "operations" &&
            "Implement robust data manipulation strategies with advanced update and delete operations, supporting complex queries, batch processing, and atomic transactions for data consistency."}
          {activeFeature === "indexing" &&
            "Dramatically boost query performance by creating custom indexes on frequently queried fields. Supports single and multi-field indexes for optimized lookups, range queries, sorting, and complex filtering operations—essential for large datasets and high-traffic applications."}
          {activeFeature === "transactions" &&
            "Ensure data integrity with ACID-compliant transactions featuring savepoints, rollback capabilities, and Write-Ahead Logging (WAL) for crash recovery. Perfect for financial operations, inventory management, and any use case requiring atomic operations."}
        </p>

        <CodeBlock
          code={featuresCode[activeFeature as keyof typeof featuresCode]}
          language="javascript"
        />
      </div>

      {/* Feature Enhancement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-accent-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Custom Query Processing
              </h3>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
              Create sophisticated queries with advanced processing logic and
              MongoDB-compatible operators for precise data filtering and
              retrieval operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Pattern Matching:
                  </span>
                  <code className="ml-2 bg-accent-50 px-2 py-1 rounded text-accent-600 font-semibold border border-accent-200 text-sm">
                    $regex
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Comparison Operators:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-accent-50 px-2 py-1 rounded text-accent-600 font-semibold border border-accent-200 text-sm">
                      $gt
                    </code>
                    <code className="bg-accent-50 px-2 py-1 rounded text-accent-600 font-semibold border border-accent-200 text-sm">
                      $lt
                    </code>
                    <code className="bg-accent-50 px-2 py-1 rounded text-accent-600 font-semibold border border-accent-200 text-sm">
                      $in
                    </code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Advanced Operations:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-accent-50 px-2 py-1 rounded text-accent-600 font-semibold border border-accent-200 text-sm">
                      .setProject()
                    </code>
                    <code className="bg-accent-50 px-2 py-1 rounded text-accent-600 font-semibold border border-accent-200 text-sm">
                      .setCount()
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-green-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <GitBranch className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ACID Transactions
              </h3>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
              Full ACID compliance with atomic operations, commit/rollback
              support, and Write-Ahead Logging for crash recovery and data
              integrity.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Transaction Control:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-green-50 px-2 py-1 rounded text-green-700 font-semibold border border-green-200 text-sm">
                      startTransaction()
                    </code>
                    <code className="bg-green-50 px-2 py-1 rounded text-green-700 font-semibold border border-green-200 text-sm">
                      commit()
                    </code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Rollback Support:
                  </span>
                  <code className="ml-2 bg-green-50 px-2 py-1 rounded text-green-700 font-semibold border border-green-200 text-sm">
                    rollback()
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Crash Recovery:
                  </span>
                  <code className="ml-2 bg-green-50 px-2 py-1 rounded text-green-700 font-semibold border border-green-200 text-sm">
                    Write-Ahead Logging
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-orange-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <RefreshCw className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Performance Optimization
              </h3>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
              Maximize application performance with intelligent caching,
              optimized queries, and strategic data access patterns designed for
              high-throughput operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Fast Lookups:
                  </span>
                  <code className="ml-2 bg-orange-50 px-2 py-1 rounded text-orange-300 font-semibold border border-orange-200 text-sm">
                    documentId
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Pagination:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-orange-50 px-2 py-1 rounded text-orange-300 font-semibold border border-orange-200 text-sm">
                      .Limit()
                    </code>
                    <code className="bg-orange-50 px-2 py-1 rounded text-orange-300 font-semibold border border-orange-200 text-sm">
                      .Skip()
                    </code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Intelligent Caching:
                  </span>
                  <code className="ml-2 bg-orange-50 px-2 py-1 rounded text-orange-300 font-semibold border border-orange-200 text-sm">
                    InMemoryCache
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <span className="text-gray-600">
                  Optimized data structure design for query patterns
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-purple-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Enterprise Data Management
              </h3>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
              Comprehensive data lifecycle management with bulk operations,
              conditional updates, and administrative functions for
              enterprise-scale database operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-gray-600">
                  High-performance bulk insert and update operations
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-gray-600">
                  Conditional updates with sophisticated query filters
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-gray-600">
                  Dynamic collection and database lifecycle management
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-gray-600">
                  Atomic operations ensuring data consistency
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-accent-50 border-l-4 border-accent-500 p-6 rounded-r-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
              <span className="text-gray-900 text-sm font-bold">💡</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-accent-700">
              Best Practices for Enterprise Implementation
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Maximize AxioDB's potential by strategically combining features:
              utilize aggregation pipelines for complex analytics, and
              leverage multi-database architecture for microservices. This
              integrated approach ensures scalable, secure, and
              high-performance database operations that meet enterprise
              standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeatures;
