import { Code, Database, Lock, RefreshCw, Rocket } from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import CodeBlock from "../ui/CodeBlock";

const AdvancedFeatures: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>("multi-db");

  const featuresCode = {
    "multi-db": `const { AxioDB, SchemaTypes } = require("axiodb");

const Instance = new AxioDB();
const CustomPathInstance = new AxioDB("NewDB", "./DB");

const setup = async () => {
  const userSchema = {
    name: SchemaTypes.string().required(),
    email: SchemaTypes.string().email().required(),
    age: SchemaTypes.number().min(0).required()
  };

  // Create database
  const UserDB = await Instance.createDB("MyDB");

  // Create different types of collections
  const UserCollection = await UserDB.createCollection("Users");
  const CollectionWithCrypto = await UserDB.createCollection("UsersWithCrypto", true);
  const CollectionWithCryptoKey = await UserDB.createCollection("UsersWithCryptoKey", true, "new");
  const CollectionWithSchema = await UserDB.createCollection("UsersWithSchema", false, "new", true, userSchema);
  const CollectionWithSchemaAndCrypto = await UserDB.createCollection("UsersWithSchemaAndCrypto", true, "new", true, userSchema);

  // Insert data with insertMany
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
};

setup();`,
    aggregation: `// Advanced aggregation pipeline with multiple stages
const aggregationResult = await UserCollection.aggregate([
  {
    $match: {
      age: { $gt: 25 }
    }
  },
  {
    $group: {
      _id: "$email",
      avgAge: { $avg: "$age" }
    }
  }
]);

console.log("Aggregation Result:", aggregationResult);

// More complex aggregation example
const complexAggregation = await UserCollection.aggregate([
  { $match: { age: { $gt: 20 }, name: { $regex: /^J/ } } },
  { $group: { _id: "$age", count: { $sum: 1 }, names: { $push: "$name" } } },
  { $sort: { count: -1 } },
  { $project: { _id: 0, age: "$_id", count: 1, names: 1 } },
  { $limit: 10 },
  { $skip: 0 }
]);

console.log("Complex Aggregation:", complexAggregation);`,
    encryption: `const encryptedCollection = await DB1.createCollection(
  "secureCollection",
  true,        // Enable encryption
  "mySecretKey",  // Custom encryption key
  true,        // Enable schema validation
  schema       // Schema object
);

// Insert encrypted data
await encryptedCollection.insert({ name: "Encrypted User", age: 25 });

// Query encrypted data
const encryptedResult = await encryptedCollection.query({ age: 25 }).exec();
console.log("Encrypted Query Result:", encryptedResult);`,
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
    "collection-types": `// Comprehensive guide to different collection types
const { AxioDB, SchemaTypes } = require("axiodb");

const Instance = new AxioDB();

const setup = async () => {
  const userSchema = {
    name: SchemaTypes.string().required(),
    email: SchemaTypes.string().email().required(),
    age: SchemaTypes.number().min(0).required()
  };

  const UserDB = await Instance.createDB("MyDB");

  // 1. Basic Collection (no crypto, no schema)
  const BasicCollection = await UserDB.createCollection("Users");

  // 2. Collection with Auto-Generated Encryption Key
  const CryptoCollection = await UserDB.createCollection("UsersWithCrypto", true);

  // 3. Collection with Custom Encryption Key
  const CustomCryptoCollection = await UserDB.createCollection("UsersWithCryptoKey", true, "myCustomKey");

  // 4. Collection with Schema Only (no encryption)
  const SchemaCollection = await UserDB.createCollection("UsersWithSchema", false, "new", true, userSchema);

  // 5. Collection with Both Schema and Encryption
  const FullFeaturedCollection = await UserDB.createCollection("UsersWithSchemaAndCrypto", true, "secureKey", true, userSchema);

  // Insert data to different collection types
  const userData = {
    name: "John Doe",
    email: "john.doe@example.com",
    age: 30
  };

  // All collections support the same operations
  await BasicCollection.insert(userData);
  await CryptoCollection.insert(userData);
  await CustomCryptoCollection.insert(userData);
  await SchemaCollection.insert(userData); // Schema validation applies
  await FullFeaturedCollection.insert(userData); // Both schema validation and encryption

  console.log("All collection types created and populated successfully!");
};

setup();`,
  };

  return (
    <section id="advanced-features" className="pt-12 scroll-mt-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-purple-200 dark:border-purple-800 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 dark:from-purple-200 dark:via-indigo-300 dark:to-blue-200 bg-clip-text text-transparent">
                Advanced Database Features
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                Enterprise-grade capabilities for complex applications
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Harness the full power of AxioDB with advanced features designed for enterprise applications. 
            Our comprehensive suite includes multi-database management, sophisticated aggregation pipelines, 
            military-grade encryption, and optimized CRUD operations that scale with your business requirements.
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
          variant={activeFeature === "encryption" ? "primary" : "outline"}
          onClick={() => setActiveFeature("encryption")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <Lock className="h-4 w-4 mr-2" />
          Data Encryption
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
          variant={activeFeature === "collection-types" ? "primary" : "outline"}
          onClick={() => setActiveFeature("collection-types")}
          className="group transition-all duration-200 hover:scale-105"
        >
          <Database className="h-4 w-4 mr-2" />
          Collection Types
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 lg:p-10 shadow-xl border border-slate-200 dark:border-slate-700 mb-12 transition-all duration-300 hover:shadow-2xl">
        <h3 className="font-bold text-2xl mb-6 text-slate-800 dark:text-slate-100">
          {activeFeature === "multi-db" &&
            "Multi-Database Architecture & Collection Management"}
          {activeFeature === "aggregation" && "Advanced Data Aggregation Pipelines"}
          {activeFeature === "encryption" && "Enterprise-Grade Data Encryption"}
          {activeFeature === "operations" && "Sophisticated CRUD Operations"}
          {activeFeature === "collection-types" && "Flexible Collection Configurations"}
        </h3>

        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {activeFeature === "multi-db" &&
            "Architect scalable applications with multiple databases and collections, each configured with specific schemas, security protocols, and performance optimizations to meet diverse business requirements."}
          {activeFeature === "aggregation" &&
            "Execute complex data processing workflows using MongoDB-compatible aggregation pipelines, enabling sophisticated filtering, grouping, sorting, and transformation operations for business intelligence and analytics."}
          {activeFeature === "encryption" &&
            "Protect sensitive business data with military-grade AES-256 encryption, featuring both auto-generated and custom encryption keys for maximum security flexibility and regulatory compliance."}
          {activeFeature === "operations" &&
            "Implement robust data manipulation strategies with advanced update and delete operations, supporting complex queries, batch processing, and atomic transactions for data consistency."}
          {activeFeature === "collection-types" &&
            "Choose from five specialized collection configurations designed for different use cases, from basic storage to fully encrypted collections with comprehensive schema validation for enterprise applications."}
        </p>

        <CodeBlock
          code={featuresCode[activeFeature as keyof typeof featuresCode]}
          language="javascript"
        />
      </div>

      {/* Feature Enhancement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Custom Query Processing</h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-lg">
              Create sophisticated queries with advanced processing logic and MongoDB-compatible operators 
              for precise data filtering and retrieval operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Pattern Matching:</span>
                  <code className="ml-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-sm">
                    $regex
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Comparison Operators:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-sm">$gt</code>
                    <code className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-sm">$lt</code>
                    <code className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-sm">$in</code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Advanced Operations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-sm">.setProject()</code>
                    <code className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1 rounded text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-sm">.setCount()</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Advanced Schema Validation</h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-lg">
              Implement robust data integrity with comprehensive schema validation rules, 
              ensuring data quality and consistency across your entire application.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Type Validation:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-2 py-1 rounded text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800 text-sm">string()</code>
                    <code className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-2 py-1 rounded text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800 text-sm">number()</code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Field Requirements:</span>
                  <code className="ml-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-2 py-1 rounded text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800 text-sm">
                    .required()
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Value Constraints:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-2 py-1 rounded text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800 text-sm">.min()</code>
                    <code className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-2 py-1 rounded text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800 text-sm">.max()</code>
                    <code className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-2 py-1 rounded text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800 text-sm">.email()</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <RefreshCw className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Performance Optimization</h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-lg">
              Maximize application performance with intelligent caching, optimized queries, 
              and strategic data access patterns designed for high-throughput operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Fast Lookups:</span>
                  <code className="ml-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 px-2 py-1 rounded text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 text-sm">
                    documentId
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Pagination:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <code className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 px-2 py-1 rounded text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 text-sm">.Limit()</code>
                    <code className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 px-2 py-1 rounded text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 text-sm">.Skip()</code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Intelligent Caching:</span>
                  <code className="ml-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 px-2 py-1 rounded text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 text-sm">
                    InMemoryCache
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <span className="text-slate-600 dark:text-slate-300">Optimized data structure design for query patterns</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Enterprise Data Management</h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-lg">
              Comprehensive data lifecycle management with bulk operations, conditional updates, 
              and administrative functions for enterprise-scale database operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-slate-600 dark:text-slate-300">High-performance bulk insert and update operations</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-slate-600 dark:text-slate-300">Conditional updates with sophisticated query filters</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-slate-600 dark:text-slate-300">Dynamic collection and database lifecycle management</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-slate-600 dark:text-slate-300">Atomic operations ensuring data consistency</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">💡</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-blue-800 dark:text-blue-200">Best Practices for Enterprise Implementation</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Maximize AxioDB's potential by strategically combining features: implement encryption for sensitive data collections, 
              utilize aggregation pipelines for complex analytics, leverage multi-database architecture for microservices, 
              and employ schema validation for data integrity. This integrated approach ensures scalable, secure, 
              and high-performance database operations that meet enterprise standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeatures;
