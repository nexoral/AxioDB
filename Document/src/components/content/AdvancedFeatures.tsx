import React, { useState } from 'react';
import { Rocket, Code, Lock, RefreshCw, Database } from 'lucide-react';
import CodeBlock from '../ui/CodeBlock';
import Button from '../ui/Button';

const AdvancedFeatures: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('multi-db');
  
  const featuresCode = {
    'multi-db': `const { AxioDB, SchemaTypes } = require("axiodb");

const db = new AxioDB();

const setup = async () => {
  const schema = {
    name: SchemaTypes.string().required().max(15),
    age: SchemaTypes.number().required().min(18),
  };

  const DB1 = await db.createDB("DB1");
  const collection1 = await DB1.createCollection(
    "collection1",
    schema,
    true,
    "secretKey",
  );

  // Insert data
  for (let i = 0; i < 300; i++) {
    await collection1.insert({ name: \`User\${i}\`, age: i + 18 });
  }

  // Query data
  const results = await collection1
    .query({})
    .Sort({ age: -1 })
    .Limit(10)
    .exec();
  console.log("Query Results:", results);

  // Delete collection
  await DB1.deleteCollection("collection1");
};

setup();`,
    'aggregation': `const aggregationResult = await collection1
  .aggregate([
    { $match: { name: { $regex: "User" } } },
    { $project: { name: 1, age: 1 } },
    { $sort: { age: -1 } },
    { $limit: 10 },
  ])
  .exec();

console.log("Aggregation Result:", aggregationResult);`,
    'encryption': `const encryptedCollection = await DB1.createCollection(
  "secureCollection",
  schema,
  true,
  "mySecretKey",
);

// Insert encrypted data
await encryptedCollection.insert({ name: "Encrypted User", age: 25 });

// Query encrypted data
const encryptedResult = await encryptedCollection.query({ age: 25 }).exec();
console.log("Encrypted Query Result:", encryptedResult);`,
    'operations': `// Update a single document
await collection1
  .update({ age: 20 })
  .UpdateOne({ name: "Updated User", gender: "Male" });

// Update multiple documents
await collection1
  .update({ name: { $regex: "User" } })
  .UpdateMany({ isActive: true });

// Delete a single document
await collection1.delete({ name: "User1" }).deleteOne();

// Delete multiple documents
await collection1.delete({ age: { $lt: 25 } }).deleteMany();`,
  };

  return (
    <section id="advanced-features" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Rocket className="h-8 w-8 text-purple-500" />
        Advanced Features
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        AxioDB provides a range of advanced features to handle complex database operations. Explore these features to unlock the full potential of AxioDB:
      </p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeFeature === 'multi-db' ? 'primary' : 'outline'}
          onClick={() => setActiveFeature('multi-db')}
        >
          Multiple Databases
        </Button>
        <Button
          variant={activeFeature === 'aggregation' ? 'primary' : 'outline'}
          onClick={() => setActiveFeature('aggregation')}
        >
          Aggregation
        </Button>
        <Button
          variant={activeFeature === 'encryption' ? 'primary' : 'outline'}
          onClick={() => setActiveFeature('encryption')}
        >
          Encryption
        </Button>
        <Button
          variant={activeFeature === 'operations' ? 'primary' : 'outline'}
          onClick={() => setActiveFeature('operations')}
        >
          Update & Delete
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
        <h3 className="font-semibold text-lg mb-4">
          {activeFeature === 'multi-db' && "Creating Multiple Databases and Collections"}
          {activeFeature === 'aggregation' && "Aggregation Pipelines"}
          {activeFeature === 'encryption' && "Encryption"}
          {activeFeature === 'operations' && "Update and Delete Operations"}
        </h3>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {activeFeature === 'multi-db' && "Create and manage multiple databases and collections with different schemas and security settings:"}
          {activeFeature === 'aggregation' && "Perform advanced operations like filtering, sorting, grouping, and projecting data:"}
          {activeFeature === 'encryption' && "Enable encryption for sensitive data by providing a secret key during collection creation:"}
          {activeFeature === 'operations' && "Perform various update and delete operations on documents:"}
        </p>
        
        <CodeBlock code={featuresCode[activeFeature as keyof typeof featuresCode]} language="javascript" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-6 w-6 text-blue-500" />
            <h3 className="font-semibold text-lg">Custom Query Processing</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            AxioDB allows you to create complex queries with custom processing logic:
          </p>
          
          <ul className="space-y-1 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Use <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">$regex</code> for pattern matching</li>
            <li>Apply comparison operators like <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">$gt</code>, <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">$lt</code></li>
            <li>Project specific fields with <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.setProject()</code></li>
            <li>Count results with <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.setCount()</code></li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-6 w-6 text-green-500" />
            <h3 className="font-semibold text-lg">Advanced Schema Validation</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Create robust schemas with advanced validation rules:
          </p>
          
          <ul className="space-y-1 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Type validation (<code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">string()</code>, <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">number()</code>, etc.)</li>
            <li>Required fields with <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.required()</code></li>
            <li>Value ranges with <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.min()</code> and <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.max()</code></li>
            <li>Format validation with <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.email()</code></li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="h-6 w-6 text-orange-500" />
            <h3 className="font-semibold text-lg">Performance Optimization</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Optimize AxioDB performance for your specific use case:
          </p>
          
          <ul className="space-y-1 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Query by <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">documentId</code> for fastest lookups</li>
            <li>Use <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.Limit()</code> and <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.Skip()</code> for pagination</li>
            <li>Leverage <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">InMemoryCache</code> for frequent queries</li>
            <li>Structure data for optimal querying patterns</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-6 w-6 text-purple-500" />
            <h3 className="font-semibold text-lg">Data Management</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Efficiently manage your data with these functions:
          </p>
          
          <ul className="space-y-1 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Bulk operations for inserting multiple documents</li>
            <li>Conditional updates with query filters</li>
            <li>Collection management (create/delete)</li>
            <li>Database operations (create/delete)</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <h3 className="font-semibold mb-2">Pro Tip</h3>
        <p className="text-gray-700 dark:text-gray-300">
          Combine these advanced features to create powerful, efficient, and secure database operations. For example, use aggregation with encryption and custom queries to process sensitive data securely while maintaining performance.
        </p>
      </div>
    </section>
  );
};

export default AdvancedFeatures;