import React from "react";
import { AlertCircle } from "lucide-react";
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

// Create a collection with schema validation
const collection = await db1.createCollection("testCollection", true, schema);
console.log("Collection with schema created:", collection);
`,
    withoutSchema: `
// Create a collection without schema validation
const collectionNoSchema = await db1.createCollection("testCollection2", false);
console.log("Collection without schema created:", collectionNoSchema);
`,
    withSchemaEncrypted: `
// Create an encrypted collection with schema validation and default encryption key
const encryptedCollection = await db1.createCollection("testCollection3", true, schema, true);
console.log("Encrypted collection with schema (default key) created:", encryptedCollection);

// Create an encrypted collection with schema validation and custom encryption key
const customKeyCollection = await db1.createCollection("testCollection4", true, schema, true, "myCustomKey");
console.log("Encrypted collection with schema (custom key) created:", customKeyCollection);
`,
    withoutSchemaEncrypted: `
// Create an encrypted collection without schema validation and default encryption key
const encryptedNoSchema = await db1.createCollection("testCollection5", false, {}, true);
console.log("Encrypted collection without schema (default key) created:", encryptedNoSchema);

// Create an encrypted collection without schema validation and custom encryption key
const customKeyNoSchema = await db1.createCollection("testCollection6", false, {}, true, "myCustomKey");
console.log("Encrypted collection without schema (custom key) created:", customKeyNoSchema);
`,
  };

  return (
    <section className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6">Create Collection</h2>

      {/* Parameter Block */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
        <h3 className="flex items-center text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          Collection Creation Parameters
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          The <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">createCollection</code> method supports the following format:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mt-2 text-sm overflow-x-auto">
{`createCollection(
  name: string,
  isSchemaNeeded: boolean,
  schema?: object,
  isEncrypted?: boolean,
  encryptionKey?: string
);`}
        </pre>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Below are examples of creating collections with different configurations.
      </p>

      {/* Full API Examples */}
      <h3 className="text-2xl font-semibold mb-4">Collection with Schema Validation</h3>
      <CodeBlock code={codeExamples.withSchema} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Collection without Schema Validation</h3>
      <CodeBlock code={codeExamples.withoutSchema} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Encrypted Collection with Schema Validation</h3>
      <CodeBlock code={codeExamples.withSchemaEncrypted} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Encrypted Collection without Schema Validation</h3>
      <CodeBlock code={codeExamples.withoutSchemaEncrypted} language="javascript" />

      {/* Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-10 mb-4">
        <h3 className="flex items-center text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          Important Notes
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>If <code>false</code> is passed for schema validation, use <code>{`{}`}</code> for the schema.</li>
          <li>Encryption keys are generated automatically if not provided.</li>
          <li>Store your custom encryption keys securely—data recovery is impossible without them.</li>
        </ul>
      </div>
    </section>
  );
};

export default CreateCollection;
