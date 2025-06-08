import React from 'react';
import { PackageOpen, Terminal } from 'lucide-react';
import CodeBlock from '../ui/CodeBlock';

const Installation: React.FC = () => {
  const installationCode = `npm install axiodb@latest --save`;

  return (
    <section id="installation" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <PackageOpen className="h-8 w-8 text-blue-500" />
        Installation
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Getting started with AxioDB is simple. You can install it via npm:
      </p>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Install via npm</h3>
        </div>
        
        <CodeBlock code={installationCode} language="bash" />
        
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> AxioDB requires Node.js version 12.0.0 or higher. Make sure you have an appropriate Node.js version installed before proceeding.
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="font-semibold text-lg mb-4">System Requirements</h3>
        
        <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
          <li><strong>Node.js:</strong> v12.0.0 or higher</li>
          <li><strong>Operating System:</strong> Cross-platform (Windows, macOS, Linux)</li>
          <li><strong>Disk Space:</strong> Minimal (~2MB for the package itself)</li>
          <li><strong>Dependencies:</strong> No external dependencies required</li>
        </ul>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
        <p className="text-gray-700 dark:text-gray-300">
          After installation, AxioDB is ready to use in your project without any additional setup or configuration! No database servers to install or configure.
        </p>
      </div>
    </section>
  );
};

export default Installation;