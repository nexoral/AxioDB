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
            AxioDB is designed to replace manual file read/write I/O and
            traditional JSON-based DBMSs for small projects and prototypes. It
            is not a replacement for Redis, but rather a solution for efficient,
            structured, and fast local data management.
          </p>
        </div>
      </div>

      {/* Graphical Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-purple-200 dark:border-purple-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">
            Traditional JSON DBMSs
          </h3>
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Single JSON file storage leads to heavy Read/Write I/O</li>
            <li>No built-in caching mechanism</li>
            <li>Linear search for document retrieval</li>
            <li>Performance degrades with larger datasets</li>
            <li>No document ID indexing system</li>
          </ul>
        </div>
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-purple-200 dark:border-purple-800 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">
            AxioDB Advantages
          </h3>
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Tree-structured storage for optimized data management</li>
            <li>InMemoryCache strategy for faster queries</li>
            <li>Auto-indexed documentId for lightning-fast searches</li>
            <li>Maintains performance with large datasets</li>
            <li>Efficient data distribution and retrieval</li>
          </ul>
        </div>
      </div>

      {/* Bar Chart Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-800 mb-12 flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">
          Performance Benchmark (1 Million Documents)
        </h3>
        <div className="w-full max-w-xl">
          <div className="flex items-end gap-6 h-48">
            {/* AxioDB Bar */}
            <div className="flex flex-col items-center w-1/3">
              <div className="bg-blue-500 h-44 w-16 rounded-t-lg shadow-lg flex items-end justify-center">
                <span className="text-white font-bold text-lg mb-2">10x</span>
              </div>
              <span className="mt-2 text-blue-700 font-semibold">AxioDB</span>
            </div>
            {/* JSON DBMS Bar */}
            <div className="flex flex-col items-center w-1/3">
              <div className="bg-purple-400 h-16 w-16 rounded-t-lg shadow-lg flex items-end justify-center">
                <span className="text-white font-bold text-lg mb-2">1x</span>
              </div>
              <span className="mt-2 text-purple-700 font-semibold">
                JSON DBMS
              </span>
            </div>
          </div>
          <div className="flex justify-between mt-4 text-gray-700 dark:text-gray-300 text-sm">
            <span>DocumentId Search Speed</span>
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
          In benchmark tests with 1 million documents, AxioDB's documentId
          search performed up to 10x faster than traditional JSON-based DBMSs,
          thanks to its tree structure and auto-indexing system.
        </p>
      </div>
    </section>
  );
};

export default Comparison;
