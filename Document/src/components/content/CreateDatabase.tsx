import React, { useEffect } from "react";
import CodeBlock from "../ui/CodeBlock";
import { React as Service } from "react-caches";

const CreateDatabase: React.FC = () => {
  useEffect(() => {
    Service.UpdateDocumentTitle("Create Database in AxioDB - Quick Start Guide");
  }, []);
  const codeExamples = {
    defaultInstance: `
const { AxioDB } = require("axiodb");

// Create AxioDB instance with GUI enabled (most common)
const db = new AxioDB(true);
console.log("AxioDB instance created with GUI at localhost:27018");
`,
    noGUI: `
// Create AxioDB instance without GUI
const db = new AxioDB(false);
console.log("AxioDB instance created without GUI");
`,
    customName: `
// Create AxioDB instance with GUI and custom root folder name
const db = new AxioDB(true, "MyCustomDB");
console.log("Custom AxioDB instance created with GUI");
`,
    customRootPath: `
// Create AxioDB instance with GUI, custom name, and custom path
const db = new AxioDB(true, "MyCustomDB", "./data");
console.log("AxioDB instance with custom path created");
`,
    createDatabase: `
// Create databases under the current AxioDB instance
const userDB = await db.createDB("UsersDB");
console.log("Database 'UsersDB' created");

const productsDB = await db.createDB("ProductsDB");
console.log("Database 'ProductsDB' created");
`,
  };

  return (
    <section className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6">Create Database</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-8">
        AxioDB constructor follows the pattern: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">new AxioDB(GUI?, RootName?, CustomPath?)</code>.
        The GUI parameter is first because most users want to enable the built-in web interface.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8">
        <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-400">
          💡 Constructor Parameters
        </h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>GUI</strong> (boolean, optional): Enable web GUI on localhost:27018 - defaults to false</li>
          <li><strong>RootName</strong> (string, optional): Custom root folder name - defaults to "AxioDB"</li>
          <li><strong>CustomPath</strong> (string, optional): Custom storage path - defaults to current directory</li>
        </ul>
      </div>

      <h3 className="text-2xl font-semibold mb-4">Basic Instance (With GUI)</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Most common use case - enable the built-in GUI for data inspection.
      </p>
      <CodeBlock code={codeExamples.defaultInstance} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Instance Without GUI</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        For production environments where you don't need the web interface.
      </p>
      <CodeBlock code={codeExamples.noGUI} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Custom Database Name</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Specify a custom root folder name for your database.
      </p>
      <CodeBlock code={codeExamples.customName} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Custom Storage Path</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Store database files in a specific directory.
      </p>
      <CodeBlock code={codeExamples.customRootPath} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Create Multiple Databases</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Create multiple isolated databases within your AxioDB instance.
      </p>
      <CodeBlock code={codeExamples.createDatabase} language="javascript" />

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-8">
        <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-400">
          ⚠️ Important Notes
        </h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300 list-disc pl-6">
          <li>Only one AxioDB instance is allowed per application (singleton pattern)</li>
          <li>GUI runs on localhost:27018 and starts automatically when enabled</li>
          <li>Database files are stored in the root folder you specify</li>
          <li>Each database can contain multiple collections</li>
        </ul>
      </div>
    </section>
  );
};

export default CreateDatabase;
