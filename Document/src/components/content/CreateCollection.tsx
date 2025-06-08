import React from 'react';
import CodeBlock from '../ui/CodeBlock';

const CreateCollection: React.FC = () => {
    const codeExamples = {
        unencrypted: `
const { AxioDB, SchemaTypes } = require("axiodb");

// Define a schema
const schema = {
  name: SchemaTypes.string().required(),
  age: SchemaTypes.number().required().min(1).max(100),
  email: SchemaTypes.string().required().email(),
};

// Create an unencrypted collection
const collection = await db1.createCollection("testCollection", schema);
console.log("Unencrypted collection created:", collection);
`,
        encryptedDefaultKey: `
// Create an encrypted collection with the default key
const collection2 = await db1.createCollection("testCollection2", schema, true);
console.log("Encrypted collection (default key) created:", collection2);
`,
        encryptedCustomKey: `
// Create an encrypted collection with a custom key
const collection3 = await db1.createCollection("testCollection3", schema, "myKey");
console.log("Encrypted collection (custom key) created:", collection3);
`,
    };

    return (
        <section className="pt-12 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Create Collection</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
                Below are examples of how to create collections using AxioDB with different configurations.
            </p>

            <h3 className="text-2xl font-semibold mb-4">Unencrypted Collection</h3>
            <CodeBlock code={codeExamples.unencrypted} language="javascript" />

            <h3 className="text-2xl font-semibold mt-8 mb-4">Encrypted Collection (Default Key)</h3>
            <CodeBlock code={codeExamples.encryptedDefaultKey} language="javascript" />

            <h3 className="text-2xl font-semibold mt-8 mb-4">Encrypted Collection (Custom Key)</h3>
            <CodeBlock code={codeExamples.encryptedCustomKey} language="javascript" />
        </section>
    );
};

export default CreateCollection;
