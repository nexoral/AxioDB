import React from 'react';
import CodeBlock from '../ui/CodeBlock';

const CreateDatabase: React.FC = () => {
    const codeExamples = {
        defaultInstance: `
const { AxioDB } = require("axiodb");

// Create a new instance of AxioDB (default root folder)
const db = new AxioDB();
console.log("Default AxioDB instance created.");
`,
        customName: `
// Create a new AxioDB instance with a custom root folder name
const dbs = new AxioDB("AnkanDB");
console.log("Custom AxioDB instance created with name 'AnkanDB'.");
`,
        customRootPath: `
// Create a new AxioDB instance with a custom root folder and relative path
const dbms = new AxioDB("AnkanDB", "../");
console.log("Custom AxioDB instance created with name 'AnkanDB' and custom root path.");
`,
        createDatabase: `
// Create a new database under the current AxioDB instance
const db1 = await db.createDB("testDB");
console.log("Database 'testDB' created.");

// Create a new database without schema validation
const db2 = await db.createDB("testDB2", false);
console.log("Database 'testDB2' created without schema validation.");
`,
    };

    return (
        <section className="pt-12 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Create Database</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
                Below are examples of how to create databases using AxioDB with different configurations.
            </p>

            <h3 className="text-2xl font-semibold mb-4">Default Instance</h3>
            <CodeBlock code={codeExamples.defaultInstance} language="javascript" />

            <h3 className="text-2xl font-semibold mt-8 mb-4">Custom Name</h3>
            <CodeBlock code={codeExamples.customName} language="javascript" />

            <h3 className="text-2xl font-semibold mt-8 mb-4">Custom Root Path</h3>
            <CodeBlock code={codeExamples.customRootPath} language="javascript" />

            <h3 className="text-2xl font-semibold mt-8 mb-4">Create Database</h3>
            <CodeBlock code={codeExamples.createDatabase} language="javascript" />
        </section>
    );
};

export default CreateDatabase;
