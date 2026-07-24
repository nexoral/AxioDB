import React from "react";
import { AlertCircle } from "lucide-react";
import CodeBlock from "../ui/CodeBlock";
import Seo from "../ui/Seo";

const CreateCollection: React.FC = () => {
  const codeExamples = {
    basic: `
const { AxioDB } = require("axiodb");

const db = new AxioDB();
const myDB = await db.createDB("MyDatabase");

// Create a collection
const collection = await myDB.createCollection("users");
console.log("Collection created:", collection);
`,
  };

  return (
    <section className="pt-12 scroll-mt-20">
      <Seo
        title="Create Collection in AxioDB"
        description="Create collections in AxioDB with a single call - schema-less by default."
        path="/create-collection"
      />
      <h1 className="text-3xl font-bold mb-6">Create Collection</h1>

      {/* Parameter Block */}
      <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
        <h3 className="flex items-center text-lg font-semibold text-blue-400 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          Collection Creation Parameters
        </h3>
        <p className="text-gray-300">
          The{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded">
            createCollection
          </code>{" "}
          method supports the following format:
        </p>
        <pre className="bg-gray-900 p-3 rounded-md mt-2 text-sm overflow-x-auto">
          {`createCollection(name: string);`}
        </pre>
      </div>

      <p className="text-gray-300 mb-4">
        Below is an example of creating a collection.
      </p>

      {/* Full API Examples */}
      <h3 className="text-2xl font-semibold mb-4">
        Create a Collection
      </h3>
      <CodeBlock code={codeExamples.basic} language="javascript" />
    </section>
  );
};

export default CreateCollection;
