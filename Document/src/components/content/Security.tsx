import { AlertTriangle, Database, Key, ShieldCheck, Zap } from "lucide-react";
import React from "react";

const Security: React.FC = () => {
  return (
    <section id="security" className="pt-12 scroll-mt-20">
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-900/20 dark:via-slate-800 dark:to-blue-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-green-200 dark:border-green-800 shadow-xl animate-fade-in">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold mb-6 flex items-center gap-2 bg-gradient-to-r from-green-700 via-blue-600 to-purple-700 bg-clip-text text-transparent">
            <ShieldCheck className="h-10 w-10 text-green-500" /> Security
          </h2>
          <p className="text-xl text-slate-700 dark:text-slate-300 font-light mb-8">
            AxioDB prioritizes data security with built-in features to protect your data—whether it's sensitive user info or critical business data.
          </p>
        </div>
      </div>

      {/* Animated Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-green-200 dark:border-green-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-8 w-8 text-blue-500" />
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">Encryption</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Optional AES-256 encryption for collections. Data is encrypted before being written to disk and decrypted when read, keeping sensitive data protected at rest.
          </p>
        </div>
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-green-200 dark:border-green-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-8 w-8 text-purple-500" />
            <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300">Secure Storage</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Data is stored in secure <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">.axiodb</code> files, using a structured format to maintain integrity and prevent unauthorized access or corruption.
          </p>
        </div>
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-green-200 dark:border-green-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-orange-500" />
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300">InMemoryCache</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            InMemoryCache improves performance and adds security by reducing disk reads, minimizing exposure of sensitive data.
          </p>
        </div>
      </div>

      {/* Security Diagram */}
      <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-8 shadow-lg mb-12 flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-300">How AxioDB Secures Your Data</h3>
        <img src="https://raw.githubusercontent.com/AnkanSaha/AxioDB/main/Document/public/AXioDB.png" alt="AxioDB Security Diagram" className="w-64 h-64 object-contain mb-4" />
        <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-2">
          <li>Encrypted at rest and in transit</li>
          <li>File-level isolation and locking</li>
          <li>Configurable access controls</li>
          <li>Automatic cache invalidation for stale data</li>
        </ul>
      </div>

      {/* Secure Collections Example */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-green-200 dark:border-green-800 mb-8 animate-fade-in-up">
        <h3 className="text-xl font-bold mb-4 text-green-700 dark:text-green-300">Implementing Secure Collections</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          To create a secure, encrypted collection, simply pass the <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">crypto</code> parameter as <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">true</code> and provide a secret key when creating the collection:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto mb-4">
          <code className="text-sm font-mono">
            {`// Create an encrypted collection with schema validation
const secureCollection = await db1.createCollection(
  "users",
  true,        // Enable encryption
  "your-strong-secret-key",  // Custom encryption key
  true,        // Enable schema validation
  userSchema   // Schema object
);

// Create an encrypted collection without schema validation
const secureCollectionNoSchema = await db1.createCollection(
  "logs",
  true,       // Enable encryption
  "your-strong-secret-key",  // Custom encryption key
  false       // Disable schema validation
);`}
          </code>
        </pre>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Once created, all operations on the collection (insert, query, update,
          delete) will automatically handle encryption and decryption, making
          the process transparent to your application.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Security Best Practices</h3>
        </div>

        <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
          <li>
            Use strong, unique encryption keys for each sensitive collection
          </li>
          <li>Never hardcode encryption keys in your application code</li>
          <li>
            Consider using environment variables or a secure key management
            system
          </li>
          <li>Implement proper application-level access controls</li>
          <li>Regularly backup your encrypted databases</li>
          <li>
            Keep your AxioDB version updated to benefit from security patches
          </li>
        </ul>
      </div>

      <p className="text-gray-700 dark:text-gray-300">
        For reporting security vulnerabilities or concerns, please refer to the{" "}
        <a
          href="#"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          SECURITY.md
        </a>{" "}
        file in the project repository.
      </p>
    </section>
  );
};

export default Security;
