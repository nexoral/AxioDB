import React from 'react';
import { CheckCircle2, Database, Lock, Zap, Layers, FilterX } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section id="features" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        Current Featured Features
      </h2>
      
      <div className="space-y-4 mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Advanced Schema Validation</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Define robust schemas to ensure data consistency and integrity across your collections.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Chainable Query Methods</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Leverage powerful methods like <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.query()</code>, <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.Sort()</code>, <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.Limit()</code>, and <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.Skip()</code> for seamless data filtering.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Optimized Node.js Streams</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Handle massive datasets effortlessly with high-performance read/write operations using optimized streams.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Encryption-First Design</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Protect sensitive data with optional AES-256 encryption for collections, ensuring data security at rest.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Aggregation Pipelines</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Perform advanced data operations like <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">$match</code>, <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">$sort</code>, <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">$group</code>, and more with MongoDB-like syntax.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">InMemoryCache Mechanism</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Accelerate query execution by caching frequently accessed data, reducing query response time significantly.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Plug-and-Play Setup</h3>
          <p className="text-gray-700 dark:text-gray-300">
            No additional database server required—install and start building instantly with minimal configuration.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Tree-like Structure</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Store data in a tree-like structure for efficient data retrieval and management.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">Auto Indexing on documentId</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Automatically create index on documentId for faster queries without manual configuration.
          </p>
        </div>
      </div>
      
      <section id="limitations" className="pt-8 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <FilterX className="h-8 w-8 text-orange-500" />
          Current Limitations
        </h2>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-lg mb-8">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            While AxioDB offers many powerful features, there are some limitations to consider:
          </p>
          
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>
              <strong>No Built-in Relation Tools:</strong> Unlike ODMs such as Mongoose, AxioDB doesn't provide built-in tools for managing document relations. While MongoDB-like NoSQL databases naturally don't enforce relations at the database level, AxioDB currently requires manual handling of references between collections.
            </li>
            <li>
              <strong>Not Optimized for Heavy Workloads:</strong> The database may not perform optimally with rapid data input/output scenarios or extremely large datasets (10M+ documents).
            </li>
            <li>
              <strong>Single-Thread Operations:</strong> Operations are performed on the main thread which can impact application performance during complex queries.
            </li>
            <li>
              <strong>Limited Query Complexity:</strong> Some advanced query patterns found in mature databases are not yet implemented.
            </li>
            <li>
              <strong>No Built-in Replication:</strong> Currently lacks distributed data replication capabilities for high availability setups.
            </li>
          </ul>
          
          <p className="mt-4 text-gray-700 dark:text-gray-300 italic">
            We're actively working to address these limitations in future releases.
          </p>
        </div>
      </section>
      
      <section id="future-plans" className="pt-8 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Layers className="h-8 w-8 text-purple-500" />
          Future Plans
        </h2>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          We're committed to continuously enhancing AxioDB with cutting-edge features:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400">
              Inbuilt Web-Based GUI Dashboard
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Provide a user-friendly, web-based interface similar to PhpMyAdmin for managing databases, collections, and data visually.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400">
              Data Export and Import Mechanisms
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Enable seamless export and import of data in various formats like JSON, CSV, and more.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400">
              Docker Image with ODM Integration
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Build a Docker image for this npm package-based DBMS, allowing integration with other programming languages via Object Document Mapping (ODM).
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400">
              Advanced Indexing
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Implement multi-level indexing for lightning-fast queries on any field or combination of fields.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400">
              Replication and Sharding
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Introduce support for distributed data replication and sharding for high availability and scalability.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400">
              Comprehensive Documentation
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Expand tutorials, examples, and API references for developers of all experience levels.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Features;