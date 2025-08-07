import { AlertCircle, BookOpen, Code2 } from "lucide-react";
import React, { useState } from "react";
import Button from "../ui/Button";
import CodeBlock from "../ui/CodeBlock";

const Usage: React.FC = () => {
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
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="h-8 w-8 text-green-500" />
        Basic Usage
      </h2>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-8">
        <h3 className="flex items-center text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          Important Note on Instance Management
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          AxioDB uses a single instance architecture. You should initialize only
          one AxioDB instance with the{" "}
          <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
            new
          </code>{" "}
          keyword, under which you can create unlimited databases, collections,
          and documents. This design ensures data consistency and security
          across your application.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          When you create an AxioDB instance and run your project, it
          automatically starts a web-based GUI on{" "}
          <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
            localhost:27018
          </code>{" "}
          for visual database management (currently under development).
        </p>
      </div>

      {step === "selectCodeType" && (
        <div className="flex flex-col items-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Select the code type you want to see:
          </p>
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={() => {
                setCodeType("commonjs");
                setStep("selectExampleType");
              }}
            >
              CommonJS
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setCodeType("es6");
                setStep("selectExampleType");
              }}
            >
              ES6 Modules
            </Button>
          </div>
        </div>
      )}

      {step === "selectExampleType" && (
        <div className="flex flex-col items-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Select the example usage you want to see:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setExampleType("read");
                setStep("showExample");
              }}
            >
              Read
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExampleType("write");
                setStep("showExample");
              }}
            >
              Write
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExampleType("update");
                setStep("showExample");
              }}
            >
              Update
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExampleType("delete");
                setStep("showExample");
              }}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExampleType("aggregate");
                setStep("showExample");
              }}
            >
              Aggregate
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExampleType("fastRetrieval");
                setStep("showExample");
              }}
            >
              Fast Retrieval
            </Button>
          </div>
        </div>
      )}

      {step === "showExample" && codeType && exampleType && (
        <div className="flex flex-col items-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Here is the {exampleType} example for {codeType}:
          </p>
          <CodeBlock
            code={examples[codeType][exampleType]}
            language="javascript"
          />
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setStep("selectExampleType")}
          >
            Back to Example Selection
          </Button>
        </div>
      )}

      <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Code2 className="h-6 w-6 text-blue-500" />
        CommonJS Example
      </h3>

      <CodeBlock
        language="javascript"
        code={`const { AxioDB, SchemaTypes } = require("axiodb");

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

  // Create collections with different options
  const collection = await db1.createCollection("collection1", false, undefined, true, schema);
  const noSchemaCollection = await db1.createCollection("collection2", false);
  const encryptedCollection = await db1.createCollection(
    "collection4", 
    true, 
    "mySecretKey", 
    true, 
    schema
  );
  
  // Rest of your application code...
};

main();`}
      />

      <h3 className="text-2xl font-semibold mb-4 mt-8 flex items-center gap-2">
        <Code2 className="h-6 w-6 text-blue-500" />
        ES Module Example
      </h3>

      <CodeBlock
        language="javascript"
        code={`import { AxioDB, SchemaTypes } from "axiodb";

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

  // Create collections with different options
  const collection = await db1.createCollection("collection1", false, undefined, true, schema);
  const noSchemaCollection = await db1.createCollection("collection2", false);
  const encryptedCollection = await db1.createCollection(
    "collection4", 
    true, 
    "mySecretKey", 
    true, 
    schema
  );
  
  // Rest of your application code...
};

main();`}
      />

      {/* Rest of the usage component would continue here */}
    </section>
  );
};

export default Usage;
