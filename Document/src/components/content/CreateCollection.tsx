import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import CodeBlock from "../ui/CodeBlock";
import { React as Service } from "react-caches";

const CreateCollection: React.FC = () => {
  useEffect(() => {
    Service.UpdateDocumentTitle("Create Collection in AxioDB - Schema & Encryption Guide");
  }, []);
  const codeExamples = {
    basic: `
const { AxioDB } = require("axiodb");

const db = new AxioDB();
const myDB = await db.createDB("MyDatabase");

// Create a basic collection (no encryption)
const collection = await myDB.createCollection("users");
console.log("Basic collection created:", collection);
`,
    encrypted: `
// Create an encrypted collection with auto-generated key
const encryptedCollection = await myDB.createCollection("secureUsers", true);
console.log("Encrypted collection created (auto-generated key):", encryptedCollection);
`,
    customKey: `
// Create an encrypted collection with custom encryption key
const customKeyCollection = await myDB.createCollection("vaultUsers", true, "mySecretKey123");
console.log("Encrypted collection created (custom key):", customKeyCollection);
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
          The{" "}
          <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">
            createCollection
          </code>{" "}
          method supports the following format:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mt-2 text-sm overflow-x-auto">
          {`createCollection(
  name: string,
  isEncrypted?: boolean,
  encryptionKey?: string
);`}
        </pre>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Below are examples of creating collections with different
        configurations.
      </p>

      {/* Full API Examples */}
      <h3 className="text-2xl font-semibold mb-4">
        Basic Collection (No Encryption)
      </h3>
      <CodeBlock code={codeExamples.basic} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Encrypted Collection (Auto-Generated Key)
      </h3>
      <CodeBlock code={codeExamples.encrypted} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Encrypted Collection (Custom Key)
      </h3>
      <CodeBlock
        code={codeExamples.customKey}
        language="javascript"
      />

      {/* Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-10 mb-4">
        <h3 className="flex items-center text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          Important Notes
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            If <code>false</code> is passed for schema validation, use{" "}
            <code>{`{}`}</code> for the schema.
          </li>
          <li>Encryption keys are generated automatically if not provided.</li>
          <li>
            Store your custom encryption keys securely—data recovery is
            impossible without them.
          </li>
        </ul>
      </div>
    </section>
  );
};

export default CreateCollection;
