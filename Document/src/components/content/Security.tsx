import React from 'react';
import { ShieldCheck, Key, AlertTriangle, Zap, Database } from 'lucide-react';

const Security: React.FC = () => {
  return (
    <section id="security" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-green-500" />
        Security
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-8">
        AxioDB prioritizes data security with several built-in features designed to protect your data. Whether you're storing sensitive user information or critical business data, AxioDB provides the tools you need to keep it secure.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Encryption</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300">
            AxioDB offers optional AES-256 encryption for collections. When enabled, all data is encrypted before being written to disk and decrypted when read, ensuring that sensitive data remains protected at rest.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Secure Storage</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300">
            Data is stored in secure <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.axiodb</code> files, which use a structured format to maintain data integrity and prevent unauthorized access or corruption.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-orange-500" />
            <h3 className="text-lg font-semibold">InMemoryCache</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300">
            The InMemoryCache mechanism not only improves performance but also adds a layer of security by reducing the frequency of disk reads, minimizing the exposure of sensitive data.
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
        <h3 className="text-xl font-semibold mb-4">Implementing Secure Collections</h3>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          To create a secure, encrypted collection, simply pass the <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">crypto</code> parameter as <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">true</code> and provide a secret key when creating the collection:
        </p>
        
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto mb-4">
          <code className="text-sm font-mono">
{`// Create an encrypted collection
const secureCollection = await db.createCollection(
  "users",
  userSchema,
  true,    // Enable encryption
  "your-strong-secret-key"
);`}
          </code>
        </pre>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Once created, all operations on the collection (insert, query, update, delete) will automatically handle encryption and decryption, making the process transparent to your application.
        </p>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Security Best Practices</h3>
        </div>
        
        <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
          <li>Use strong, unique encryption keys for each sensitive collection</li>
          <li>Never hardcode encryption keys in your application code</li>
          <li>Consider using environment variables or a secure key management system</li>
          <li>Implement proper application-level access controls</li>
          <li>Regularly backup your encrypted databases</li>
          <li>Keep your AxioDB version updated to benefit from security patches</li>
        </ul>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300">
        For reporting security vulnerabilities or concerns, please refer to the <a href="#" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">SECURITY.md</a> file in the project repository.
      </p>
    </section>
  );
};

export default Security;