import { AlertCircle } from "lucide-react";
import React from "react";
import CodeBlock from "../ui/CodeBlock";

const CreateCollection: React.FC = () => {
  const codeExamples = {
    withSchema: `
const { AxioDB, SchemaTypes } = require("axiodb");

// Define a schema
const schema = {
  name: SchemaTypes.string().required(),
  age: SchemaTypes.number().required().min(1).max(100),
  email: SchemaTypes.string().required().email(),
};

// Create a collection with schema validation (traditional way)
const collection = await db1.createCollection("testCollection", true, schema);
console.log("Collection with schema created:", collection);
`,
    withSchemaExplicit: `
// Create a collection with explicit schema validation (true as second param)
const collection = await db1.createCollection("testCollection", true, schema);
console.log("Collection with explicit schema created:", collection);
`,
    withoutSchema: `
// Create a collection without schema validation
const collection = await db1.createCollection("testCollection", false);
console.log("Collection without schema created:", collection);
`,
    withSchemaEncryption: `
// Create a collection with schema validation and encryption (using default encryption key)
const collection = await db1.createCollection("testCollection", schema, true);
console.log("Encrypted collection (with schema, default key) created:", collection);

// Create a collection with schema validation and encryption (using custom key)
const collection2 = await db1.createCollection("testCollection2", schema, true, "mySecretKey");
console.log("Encrypted collection (with schema, custom key) created:", collection2);
`,
    withoutSchemaEncryption: `
// Create a collection without schema but with encryption (using default encryption key)
// Note: We pass false for schema validation, then an empty object {}, then true for encryption
const collection = await db1.createCollection("testCollection", false, {}, true);
console.log("Encrypted collection (no schema, default key) created:", collection);

// Create a collection without schema but with encryption (using custom key)
const collection2 = await db1.createCollection("testCollection", false, {}, true, "mySecretKey");
console.log("Encrypted collection (no schema, custom key) created:", collection2);
`,
    explicitSchemaEncryption: `
// Create a collection with explicit schema validation and encryption (using default key)
const collection = await db1.createCollection("testCollection", true, schema, true);
console.log("Encrypted collection (explicit schema, default key) created:", collection);

// Create a collection with explicit schema validation and encryption (using custom key)
const collection2 = await db1.createCollection("testCollection2", true, schema, true, "mySecretKey");
console.log("Encrypted collection (explicit schema, custom key) created:", collection2);
`,
  };

  return (
    <section className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6">Create Collection</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Below are examples of how to create collections using AxioDB with
        different configurations.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
        <h3 className="flex items-center text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          Schema Validation is Optional
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          In the current version of AxioDB, schema validation is optional when creating collections. The{" "}
          <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
            createCollection
          </code>{" "}
          method has flexible parameters:
        </p>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300 pl-4">
          <li>
            <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
              name
            </code>
            : Collection name (required)
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
              schemaOrBoolean
            </code>
            : Can be either a schema object or boolean
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
              schemaOrCrypto
            </code>
            : Schema object (if previous param was true) or empty object { } (if
            schema validation is disabled)
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
              crypto
            </code>
            : Boolean to enable/disable encryption
          </li>
          <li>
            <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
              key
            </code>
            : Optional custom encryption key
          </li>
        </ol>
      </div>

      <h3 className="text-2xl font-semibold mb-4">With Schema Validation</h3>
      <CodeBlock code={codeExamples.withSchema} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        With Explicit Schema Validation Flag
      </h3>
      <CodeBlock code={codeExamples.withSchemaExplicit} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Without Schema Validation</h3>
      <CodeBlock code={codeExamples.withoutSchema} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        With Schema Validation and Encryption
      </h3>
      <CodeBlock code={codeExamples.withSchemaEncryption} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Without Schema Validation but With Encryption
      </h3>
      <CodeBlock code={codeExamples.withoutSchemaEncryption} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        With Explicit Schema Validation and Encryption
      </h3>
      <CodeBlock code={codeExamples.explicitSchemaEncryption} language="javascript" />
    </section>
  );
};

export default CreateCollection;
