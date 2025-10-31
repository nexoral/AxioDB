import {
  AlertCircle,
  BookOpen,
  Code2,
  Zap,
  Database,
  Search,
  Play,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import CodeBlock from "../ui/CodeBlock";
import { React as Service } from "react-caches";

const Usage: React.FC = () => {
  React.useEffect(() => {
    Service.UpdateDocumentTitle("AxioDB Basic Usage - CRUD Operations & Query Guide");
  }, []);
  const [step, setStep] = useState<
    "selectCodeType" | "selectExampleType" | "showExample"
  >("selectCodeType");
  const [codeType, setCodeType] = useState<"commonjs" | "es6" | null>(null);
  const [exampleType, setExampleType] = useState<
    | "read"
    | "write"
    | "update"
    | "delete"
    | "aggregate"
    | "fastRetrieval"
    | null
  >(null);

  const examples = {
    commonjs: {
      read: `const documents = await collection.query({ age: { $gt: 20 } }).exec();
console.log(documents);`,
      write: `const saveStatus = await collection.insert({ name: "Ankan", age: 21, email: "ankan@example.com" });
console.log(saveStatus);`,
      update: `const updatedDocuments = await collection.update({ name: { $regex: "Ankan" } }).UpdateOne({ name: "Ankan Saha", age: 22 });
console.log(updatedDocuments);`,
      delete: `const deletedDocuments = await collection.delete({ name: { $regex: "Ankan" } }).deleteOne();
console.log(deletedDocuments);`,
      aggregate: `const response = await collection.aggregate([
  { $match: { age: { $gt: 20 }, name: { $regex: "Ankan" } } }, // Filter documents
  { $group: { _id: "$age", count: { $sum: 1 } } }, // Group by age and count occurrences
  { $sort: { count: -1 } }, // Sort by count in descending order
  { $project: { _id: 0, age: "$_id", count: 1 } }, // Project specific fields
  { $limit: 10 }, // Limit the number of results
  { $skip: 0 } // Skip a certain number of results
]).exec();
console.log(response);`,
      fastRetrieval: `// Retrieve a single document by documentId
const singleDocument = await collection.query({ documentId: "S4ACDVS6SZ4S6VS" }).exec();
console.log(singleDocument);

// Retrieve multiple documents by an array of documentIds
const multipleDocuments = await collection.query({ documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"] }).exec();
console.log(multipleDocuments);

// Retrieve documents with additional filters
const filteredDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"],
  age: { $gt: 20 }
}).exec();
console.log(filteredDocuments);

// Retrieve documents with projection
const projectedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).setProject({ name: 1, age: 1 }).exec();
console.log(projectedDocuments);

// Retrieve documents with sorting
const sortedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Sort({ age: -1 }).exec();
console.log(sortedDocuments);

// Retrieve documents with pagination
const paginatedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Limit(2).Skip(1).exec();
console.log(paginatedDocuments);`,
    },
    es6: {
      read: `const documents = await collection.query({ age: { $gt: 20 } }).exec();
console.log(documents);`,
      write: `const saveStatus = await collection.insert({ name: "Ankan", age: 21, email: "ankan@example.com" });
console.log(saveStatus);`,
      update: `const updatedDocuments = await collection.update({ name: { $regex: "Ankan" } }).UpdateOne({ name: "Ankan Saha", age: 22 });
console.log(updatedDocuments);`,
      delete: `const deletedDocuments = await collection.delete({ name: { $regex: "Ankan" } }).deleteOne();
console.log(deletedDocuments);`,
      aggregate: `const response = await collection.aggregate([
  { $match: { age: { $gt: 20 }, name: { $regex: "Ankan" } } }, // Filter documents
  { $group: { _id: "$age", count: { $sum: 1 } } }, // Group by age and count occurrences
  { $sort: { count: -1 } }, // Sort by count in descending order
  { $project: { _id: 0, age: "$_id", count: 1 } }, // Project specific fields
  { $limit: 10 }, // Limit the number of results
  { $skip: 0 } // Skip a certain number of results
]).exec();
console.log(response);`,
      fastRetrieval: `// Retrieve a single document by documentId
const singleDocument = await collection.query({ documentId: "S4ACDVS6SZ4S6VS" }).exec();
console.log(singleDocument);

// Retrieve multiple documents by an array of documentIds
const multipleDocuments = await collection.query({ documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"] }).exec();
console.log(multipleDocuments);

// Retrieve documents with additional filters
const filteredDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"],
  age: { $gt: 20 }
}).exec();
console.log(filteredDocuments);

// Retrieve documents with projection
const projectedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).setProject({ name: 1, age: 1 }).exec();
console.log(projectedDocuments);

// Retrieve documents with sorting
const sortedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Sort({ age: -1 }).exec();
console.log(sortedDocuments);

// Retrieve documents with pagination
const paginatedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Limit(2).Skip(1).exec();
console.log(paginatedDocuments);`,
    },
  };

  return (
    <section id="usage" className="pt-12 scroll-mt-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-900/20 dark:via-slate-800 dark:to-emerald-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-green-200 dark:border-green-800 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg animate-glow">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-800 via-emerald-700 to-teal-700 dark:from-green-200 dark:via-emerald-300 dark:to-teal-200 bg-clip-text text-transparent">
                Getting Started with AxioDB
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                Interactive examples and comprehensive usage guide
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Explore AxioDB's powerful features through interactive examples.
            From basic CRUD operations to advanced aggregation pipelines, master
            every aspect of modern NoSQL database operations with our
            comprehensive, production-ready code samples.
          </p>
        </div>
      </div>

      {/* Important Note Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8 lg:p-10 border-l-4 border-yellow-500 shadow-xl mb-12">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-3">
              Instance Management Architecture
            </h3>
            <div className="space-y-4 text-lg text-yellow-800 dark:text-yellow-200 leading-relaxed">
              <p>
                AxioDB employs a <strong>single instance architecture</strong>{" "}
                for optimal data consistency and security. Initialize one AxioDB
                instance with the{" "}
                <code className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg text-yellow-700 dark:text-yellow-300 font-semibold border border-yellow-200 dark:border-yellow-800">
                  new
                </code>{" "}
                keyword, enabling unlimited databases, collections, and
                documents under unified management.
              </p>
              <p>
                Upon instance creation, AxioDB automatically launches a
                comprehensive web-based management interface at{" "}
                <code className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg text-yellow-700 dark:text-yellow-300 font-semibold border border-yellow-200 dark:border-yellow-800">
                  localhost:27018
                </code>{" "}
                for visual database administration and real-time monitoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Examples Section */}
      <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 mb-16 border border-slate-200 dark:border-slate-700">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <Play className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Interactive Code Examples
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Explore different operations with live code samples
              </p>
            </div>
          </div>

          {step === "selectCodeType" && (
            <div className="text-center">
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
                Choose your preferred module system to get started:
              </p>
              <div className="flex justify-center gap-6">
                <button
                  className="group relative bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                  onClick={() => {
                    setCodeType("commonjs");
                    setStep("selectExampleType");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6" />
                    CommonJS
                  </div>
                </button>
                <button
                  className="group relative bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                  onClick={() => {
                    setCodeType("es6");
                    setStep("selectExampleType");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    ES6 Modules
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "selectExampleType" && (
            <div className="text-center">
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
                Select the operation you want to explore:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    key: "read",
                    label: "Read Operations",
                    icon: Search,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    key: "write",
                    label: "Write Operations",
                    icon: Database,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    key: "update",
                    label: "Update Operations",
                    icon: Code2,
                    color: "from-orange-500 to-amber-500",
                  },
                  {
                    key: "delete",
                    label: "Delete Operations",
                    icon: AlertCircle,
                    color: "from-red-500 to-rose-500",
                  },
                  {
                    key: "aggregate",
                    label: "Aggregations",
                    icon: BookOpen,
                    color: "from-purple-500 to-violet-500",
                  },
                  {
                    key: "fastRetrieval",
                    label: "Fast Retrieval",
                    icon: Zap,
                    color: "from-indigo-500 to-blue-500",
                  },
                ].map((example) => {
                  const Icon = example.icon;
                  return (
                    <button
                      key={example.key}
                      className={`group relative bg-gradient-to-r ${example.color} text-white p-6 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300`}
                      onClick={() => {
                        setExampleType(example.key as any);
                        setStep("showExample");
                      }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Icon className="h-8 w-8" />
                        {example.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "showExample" && codeType && exampleType && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {exampleType.charAt(0).toUpperCase() + exampleType.slice(1)}{" "}
                  Example (
                  {codeType === "commonjs" ? "CommonJS" : "ES6 Modules"})
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  Production-ready code example for {exampleType} operations
                </p>
              </div>
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-xl p-6 shadow-inner">
                <CodeBlock
                  code={examples[codeType][exampleType]}
                  language="javascript"
                />
              </div>
              <div className="text-center">
                <button
                  className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                  onClick={() => setStep("selectExampleType")}
                >
                  ← Back to Examples
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Examples Section */}
      <div className="space-y-12">
        {/* CommonJS Example */}
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-blue-50/30 dark:from-green-900/10 dark:to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-lg">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Complete CommonJS Implementation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Production-ready example with all major features
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-xl p-6 shadow-inner">
              <CodeBlock
                language="javascript"
                code={`const { AxioDB, SchemaTypes } = require("axiodb");

// Create a single AxioDB instance for your entire application
// Enable GUI (most common): localhost:27018
const Instance = new AxioDB(true);

// Other constructor options:
const NoGUIInstance = new AxioDB(false); // Disable GUI
const CustomNameInstance = new AxioDB(true, "MyCustomDB"); // Custom database name
const CustomPathInstance = new AxioDB(true, "MyDB", "./data"); // Custom path

const main = async () => {
  // Define a schema for user data
  const userSchema = {
    name: SchemaTypes.string().required(),
    email: SchemaTypes.string().email().required(),
    age: SchemaTypes.number().min(0).required()
  };

  // Create database
  const UserDB = await Instance.createDB("MyDB");

  // Create different types of collections
  const UserCollection = await UserDB.createCollection("Users"); // Basic collection
  const CollectionWithCrypto = await UserDB.createCollection("UsersWithCrypto", true); // With auto-generated key
  const CollectionWithCryptoKey = await UserDB.createCollection("UsersWithCryptoKey", true, "new"); // With custom key
  const CollectionWithSchema = await UserDB.createCollection("UsersWithSchema", false, "new", true, userSchema); // With schema
  const CollectionWithSchemaAndCrypto = await UserDB.createCollection("UsersWithSchemaAndCrypto", true, "new", true, userSchema); // With both

  // Insert single document
  await UserCollection.insert({
    name: "John Doe",
    email: "john.doe@example.com",
    age: 30
  });

  // Insert multiple documents
  await UserCollection.insertMany([
    {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      age: 25
    },
    {
      name: "Alice Smith",
      email: "alice.smith@example.com",
      age: 28
    }
  ]);

  // Query with different operators
  const olderUsers = await UserCollection.query({
    age: { $gt: 25 }
  }).exec();

  // Regex query
  const exampleUsers = await UserCollection.query({
    email: { $regex: /example.com$/ }
  }).exec();

  // Complex query with chaining
  const results = await UserCollection.query({
    email: { $in: ["john.doe@example.com", "jane.doe@example.com"] }
  }).Limit(10).Skip(2).Sort({ age: 1 }).findOne(true).setCount(true).setProject({
    _id: 1,
    name: 1,
    email: 1
  }).exec();

  // Fast retrieval by documentId
  const fastRes = await UserCollection.query({ documentId: "JOHTAOIJNHUJOBD"}).exec();

  // Aggregation pipeline
  const aggData = await UserCollection.aggregate([
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

  // Update operations
  await UserCollection.update({name: "John Doe"}).UpdateOne({name: "Ankan"});
  await UserCollection.update({name: "John Doe"}).UpdateMany({name: "Ankan"});

  // Delete operations
  await UserCollection.delete({name: "John Doe"}).DeleteOne();
  await UserCollection.delete({name: "John Doe"}).DeleteMany();
};

main();`}
              />
            </div>
          </div>
        </div>

        {/* ES6 Module Example */}
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Complete ES6 Module Implementation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Modern JavaScript with import/export syntax
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-purple-900 rounded-xl p-6 shadow-inner">
              <CodeBlock
                language="javascript"
                code={`import { AxioDB, SchemaTypes } from "axiodb";

// Create a single AxioDB instance for your entire application
// Enable GUI (most common): localhost:27018
const Instance = new AxioDB(true);

// Other constructor options:
const NoGUIInstance = new AxioDB(false); // Disable GUI
const CustomNameInstance = new AxioDB(true, "MyCustomDB"); // Custom database name
const CustomPathInstance = new AxioDB(true, "MyDB", "./data"); // Custom path

const main = async () => {
  // Define a schema for user data
  const userSchema = {
    name: SchemaTypes.string().required(),
    email: SchemaTypes.string().email().required(),
    age: SchemaTypes.number().min(0).required()
  };

  // Create database
  const UserDB = await Instance.createDB("MyDB");

  // Create different types of collections
  const UserCollection = await UserDB.createCollection("Users"); // Basic collection
  const CollectionWithCrypto = await UserDB.createCollection("UsersWithCrypto", true); // With auto-generated key
  const CollectionWithCryptoKey = await UserDB.createCollection("UsersWithCryptoKey", true, "new"); // With custom key
  const CollectionWithSchema = await UserDB.createCollection("UsersWithSchema", false, "new", true, userSchema); // With schema
  const CollectionWithSchemaAndCrypto = await UserDB.createCollection("UsersWithSchemaAndCrypto", true, "new", true, userSchema); // With both

  // Insert single document
  await UserCollection.insert({
    name: "John Doe",
    email: "john.doe@example.com",
    age: 30
  });

  // Insert multiple documents
  await UserCollection.insertMany([
    {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      age: 25
    },
    {
      name: "Alice Smith",
      email: "alice.smith@example.com",
      age: 28
    }
  ]);

  // Query with different operators
  const olderUsers = await UserCollection.query({
    age: { $gt: 25 }
  }).exec();

  // Regex query
  const exampleUsers = await UserCollection.query({
    email: { $regex: /example.com$/ }
  }).exec();

  // Complex query with chaining
  const results = await UserCollection.query({
    email: { $in: ["john.doe@example.com", "jane.doe@example.com"] }
  }).Limit(10).Skip(2).Sort({ age: 1 }).findOne(true).setCount(true).setProject({
    _id: 1,
    name: 1,
    email: 1
  }).exec();

  // Fast retrieval by documentId
  const fastRes = await UserCollection.query({ documentId: "JOHTAOIJNHUJOBD"}).exec();

  // Aggregation pipeline
  const aggData = await UserCollection.aggregate([
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

  // Update operations
  await UserCollection.update({name: "John Doe"}).UpdateOne({name: "Ankan"});
  await UserCollection.update({name: "John Doe"}).UpdateMany({name: "Ankan"});

  // Delete operations
  await UserCollection.delete({name: "John Doe"}).DeleteOne();
  await UserCollection.delete({name: "John Doe"}).DeleteMany();
};

main();`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Usage;
