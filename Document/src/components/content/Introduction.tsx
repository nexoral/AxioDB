import React from 'react';
import { Database, Zap, Shield, Code } from 'lucide-react';
import PainPoints from './PainPoints';

const Introduction: React.FC = () => {
  return (
    <section id="introduction" className="scroll-mt-20">
      <h1 className="text-4xl font-bold mb-6">AxioDB: A NoSQL Based DBMS</h1>

      <div className="flex items-center gap-2 mb-6">
        <img src="https://badge.fury.io/js/axiodb.svg" alt="npm version" className="h-6" />
        <img src="https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main" alt="CodeQL" className="h-6" />
        <img src="https://dl.circleci.com/status-badge/img/gh/AnkanSaha/AxioDB/tree/main.svg?style=svg" alt="CircleCI" className="h-6" />
        <img src="https://socket.dev/api/badge/npm/package/axiodb" alt="Socket Security" className="h-6" />
      </div>

      <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
        AxioDB is a blazing-fast, lightweight, and scalable open-source Database Management System (DBMS)
        tailored for modern applications. It supports <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">.axiodb</code> file-based
        data storage, offers intuitive APIs, and ensures secure data management. AxioDB is the ultimate
        solution for developers seeking efficient, flexible, and production-ready database solutions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-orange-500" />
            <h3 className="text-xl font-semibold">Blazing Fast</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Optimized for performance with Node.js streams and in-memory caching,
            delivering lightning-fast data operations even with large datasets.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-8 w-8 text-blue-500" />
            <h3 className="text-xl font-semibold">File-Based Storage</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Leverages <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">.axiodb</code> files for data storage,
            eliminating the need for complex database servers while maintaining data integrity.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-green-500" />
            <h3 className="text-xl font-semibold">Security-First</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Built with security in mind, featuring optional AES-256 encryption for collections and
            robust schema validation to protect your data.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8 text-purple-500" />
            <h3 className="text-xl font-semibold">Developer Friendly</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Intuitive APIs with chainable query methods, MongoDB-like syntax, and advanced schema validation
            make development a breeze.
          </p>
        </div>
      </div>

      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-6 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
        <p className="italic text-gray-700 dark:text-gray-300">
          "AxioDB is the ultimate solution for developers seeking efficient, flexible, and production-ready database solutions."
        </p>
      </blockquote>

      <PainPoints />
    </section>
  );
};

export default Introduction;