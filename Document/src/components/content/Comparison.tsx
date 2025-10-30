import { GitCompare, Zap } from "lucide-react";
import React from "react";

const Comparison: React.FC = () => {
  return (
    <section id="comparison" className="pt-12 scroll-mt-20">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-900/20 dark:via-slate-800 dark:to-blue-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-purple-200 dark:border-purple-800 shadow-xl animate-fade-in">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold mb-6 flex items-center gap-2 bg-gradient-to-r from-purple-700 via-blue-600 to-pink-700 bg-clip-text text-transparent">
            <GitCompare className="h-10 w-10 text-purple-500" /> Performance
            Comparison
          </h2>
          <p className="text-xl text-slate-700 dark:text-slate-300 font-light mb-8">
            AxioDB is designed for embedded applications requiring local data storage
            with intelligent caching. It combines the simplicity of SQLite with MongoDB-style
            queries—no native dependencies, no SQL strings, pure JavaScript.
          </p>
        </div>
      </div>

      {/* Graphical Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-purple-200 dark:border-purple-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">
            Traditional JSON Files
          </h3>
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Single JSON file storage leads to heavy Read/Write I/O</li>
            <li>No built-in caching mechanism</li>
            <li>Linear search for document retrieval</li>
            <li>Performance degrades with larger datasets</li>
            <li>No indexing system</li>
            <li>Manual file locking for concurrent access</li>
          </ul>
        </div>
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-purple-200 dark:border-purple-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">
            AxioDB Advantages
          </h3>
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>File-per-document storage for optimized data management</li>
            <li>InMemoryCache strategy for faster queries</li>
            <li>Auto-indexed documentId for lightning-fast searches</li>
            <li>Maintains performance with large datasets</li>
            <li>Multi-core parallelism with Worker Threads</li>
            <li>Built-in query operators ($gt, $lt, $regex, $in)</li>
          </ul>
        </div>
      </div>

      {/* SQLite vs AxioDB Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-800 mb-12">
        <h3 className="text-2xl font-bold mb-6 text-purple-700 dark:text-purple-300">
          AxioDB vs SQLite
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="px-6 py-4 text-left font-semibold border-b border-slate-200 dark:border-slate-600">Feature</th>
                <th className="px-6 py-4 text-center font-semibold border-b border-slate-200 dark:border-slate-600">SQLite</th>
                <th className="px-6 py-4 text-center font-semibold border-b border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/20">AxioDB</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-6 py-4 font-medium">Native Dependencies</td>
                <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">❌ Yes (C bindings)</td>
                <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">✅ Pure JavaScript</td>
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-6 py-4 font-medium">Query Language</td>
                <td className="px-6 py-4 text-center">SQL Strings</td>
                <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">JavaScript Objects</td>
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-6 py-4 font-medium">Schema Migrations</td>
                <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">❌ Required (ALTER TABLE)</td>
                <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">✅ Schema-less (optional)</td>
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-6 py-4 font-medium">Built-in Caching</td>
                <td className="px-6 py-4 text-center text-yellow-600 dark:text-yellow-400">⚠️ Manual</td>
                <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">✅ InMemoryCache</td>
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-6 py-4 font-medium">Multi-core Processing</td>
                <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">❌ Single-threaded</td>
                <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">✅ Worker Threads</td>
              </tr>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td className="px-6 py-4 font-medium">Built-in GUI</td>
                <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">❌ External tools only</td>
                <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">✅ Web interface included</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Best For</td>
                <td className="px-6 py-4 text-center">10M+ records, relational data</td>
                <td className="px-6 py-4 text-center bg-green-50 dark:bg-green-900/10">10K-500K documents, embedded apps</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-800 mb-12 flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">
          Performance Benchmark (DocumentId Lookup)
        </h3>
        <div className="w-full max-w-xl">
          <div className="flex items-end gap-6 h-48">
            {/* AxioDB Bar */}
            <div className="flex flex-col items-center w-1/3">
              <div className="bg-blue-500 h-[9rem] w-20 rounded-t-lg shadow-lg flex items-end justify-center">
                <span className="text-white font-bold text-lg mb-2">Fast</span>
              </div>
              <span className="mt-2 text-blue-700 dark:text-blue-400 font-semibold">AxioDB</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">O(1) with cache</span>
            </div>
            {/* JSON Files Bar */}
            <div className="flex flex-col items-center w-1/3">
              <div className="bg-purple-400 h-16 w-20 rounded-t-lg shadow-lg flex items-end justify-center">
                <span className="text-white font-bold text-lg mb-2">Slow</span>
              </div>
              <span className="mt-2 text-purple-700 dark:text-purple-400 font-semibold">
                JSON Files
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">O(n) linear scan</span>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-gray-700 dark:text-gray-300 text-sm">
            <span>Document Retrieval Speed</span>
            <span>Higher is Better</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Performance Metrics
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          AxioDB's file-per-document architecture with InMemoryCache provides
          instant document retrieval by ID. Unlike traditional JSON files that require
          full-file parsing, or SQLite's native dependencies, AxioDB offers pure
          JavaScript performance with intelligent caching for embedded applications.
        </p>
      </div>
    </section>
  );
};

export default Comparison;
