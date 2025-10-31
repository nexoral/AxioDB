import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { React as Service } from "react-caches";

const WhyChooseAxioDBPage: React.FC = () => {
  useEffect(() => {
    Service.UpdateDocumentTitle("Why Choose AxioDB - Perfect Embedded Database for Node.js");
  }, []);
  return (
    <>
      <Helmet>
        <title>Why Choose AxioDB - AxioDB Documentation</title>
        <meta
          name="description"
          content="Learn why AxioDB is the perfect embedded database for Node.js applications"
        />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 mb-8 border border-blue-200 dark:border-blue-800">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Why Choose AxioDB?
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300">
            A robust embedded database for Node.js applications requiring local storage with
            intelligent caching. <span className="font-semibold">Pure JavaScript. MongoDB-style queries. Built-in caching.</span>
          </p>
        </div>

        {/* The Problem Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-4xl">🎯</span> The Need for Embedded Databases
          </h2>

          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Modern applications need local data storage that's:
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 pl-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-1">✓</span>
                  <span>Fast and efficient for frequent read/write operations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-1">✓</span>
                  <span>Easy to deploy without external dependencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-1">✓</span>
                  <span>Simple to query without learning SQL</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-1">✓</span>
                  <span>Capable of handling medium-scale datasets efficiently</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl">
              <h3 className="text-xl font-semibold mb-3">Traditional Approaches Fall Short</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">SQLite:</h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-6 text-sm">
                    <li>• Requires native C bindings (better-sqlite3, node-sqlite3)</li>
                    <li>• Platform-specific compilation issues</li>
                    <li>• SQL strings instead of JavaScript objects</li>
                    <li>• Schema migrations required for data model changes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">JSON Files:</h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-6 text-sm">
                    <li>• Full file read/write for every operation</li>
                    <li>• No built-in querying or indexing</li>
                    <li>• Linear search performance</li>
                    <li>• Manual caching implementation needed</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">MongoDB (Server):</h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-6 text-sm">
                    <li>• Requires separate server installation</li>
                    <li>• Overkill for small-to-medium datasets</li>
                    <li>• Complex deployment for simple apps</li>
                    <li>• Not suitable for embedded scenarios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-4xl">✨</span> AxioDB: The Complete Solution
          </h2>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-400 dark:border-green-700 p-8 rounded-2xl mb-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4">Core Advantages</h3>
                <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <div>
                      <strong>Pure JavaScript:</strong> Zero native dependencies
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <div>
                      <strong>MongoDB-style Queries:</strong> JavaScript objects, not SQL
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <div>
                      <strong>Intelligent Caching:</strong> InMemoryCache for instant queries
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <div>
                      <strong>Multi-core Performance:</strong> Worker Threads for parallelism
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <div>
                      <strong>Built-in GUI:</strong> Web interface for data inspection
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4">Perfect For</h3>
                <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span>📱</span>
                    <span>Electron & desktop applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>⚙️</span>
                    <span>CLI tools with persistent storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🚀</span>
                    <span>Rapid prototyping & MVPs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>💾</span>
                    <span>10K-500K document applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🏠</span>
                    <span>Local-first & embedded systems</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">📊 Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold">SQLite</th>
                  <th className="px-6 py-4 text-center font-semibold">JSON Files</th>
                  <th className="px-6 py-4 text-center font-semibold bg-green-100 dark:bg-green-900/40">AxioDB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="px-6 py-4 font-medium">Native Dependencies</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ Yes</td>
                  <td className="px-6 py-4 text-center text-green-600">✅ No</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">✅ No</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Query Language</td>
                  <td className="px-6 py-4 text-center">SQL Strings</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ Manual</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">JS Objects</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Built-in Caching</td>
                  <td className="px-6 py-4 text-center text-yellow-600">⚠️ Page cache only</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ None</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">✅ InMemoryCache</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Schema Flexibility</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ Rigid (migrations)</td>
                  <td className="px-6 py-4 text-center text-green-600">✅ Schema-less</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">✅ Optional schemas</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Multi-core Processing</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ Single-threaded</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ No</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">✅ Worker Threads</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Built-in GUI</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ External tools</td>
                  <td className="px-6 py-4 text-center text-red-600">❌ None</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">✅ Included</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Deployment Complexity</td>
                  <td className="px-6 py-4 text-center text-yellow-600">⚠️ Platform-specific</td>
                  <td className="px-6 py-4 text-center text-green-600">✅ Simple</td>
                  <td className="px-6 py-4 text-center text-green-600 bg-green-50 dark:bg-green-900/20">✅ npm install</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-4xl">💡</span> Real-World Use Cases
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-3">Desktop Applications</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Store user preferences, application state, and local data without requiring users to install database servers.
              </p>
              <code className="text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                new AxioDB(true)
              </code>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-3">CLI Tools</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Persist configuration, cache API responses, and manage local data for command-line applications.
              </p>
              <code className="text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                new AxioDB(false, "MyCliTool")
              </code>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-3">Rapid Prototyping</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Build and iterate quickly without setting up external databases. Scale to proper DBMS when needed.
              </p>
              <code className="text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                MongoDB-style queries
              </code>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold mb-3">Embedded Systems</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Single-user applications, IoT devices, and edge computing scenarios requiring local data persistence.
              </p>
              <code className="text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                Pure JavaScript
              </code>
            </div>
          </div>
        </section>

        {/* When NOT to Use */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-4xl">⚠️</span> When to Use Traditional Databases
          </h2>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-xl">
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-4 font-semibold">
              Choose PostgreSQL, MongoDB, or SQLite instead for:
            </p>
            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">→</span>
                <span><strong>10M+ documents:</strong> Traditional databases scale better with massive datasets</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">→</span>
                <span><strong>Multi-user web applications:</strong> Server databases handle concurrency better</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">→</span>
                <span><strong>Complex relational data:</strong> SQL databases with JOIN operations are designed for this</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">→</span>
                <span><strong>Distributed systems:</strong> AxioDB is single-instance, no clustering/replication</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-6 text-blue-100">
              Pure JavaScript. MongoDB-style queries. Built-in caching. Zero dependencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/installation"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                📦 Install AxioDB
              </a>
              <a
                href="/usage"
                className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                📖 View Documentation
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default WhyChooseAxioDBPage;
