import {
  BarChart3,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Layers,
  Lock,
  Search,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";

const Features: React.FC = () => {
  return (
    <section id="features" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB Features - Production-Ready NoSQL Database for Node.js"
        description="Explore AxioDB's caching, indexing, transactions, encryption, and GUI features for embedded Node.js applications."
        path="/features"
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/20 via-slate-800 to-green-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-emerald-800 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-400/10 to-green-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-200 via-green-300 to-teal-200 bg-clip-text text-transparent">
                Production Caching Features
              </h1>
              <p className="text-xl text-slate-300 font-light mt-2">
                Advanced caching capabilities for modern production environments
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-300 leading-relaxed">
            AxioDB delivers a complete suite of caching features engineered
            specifically for production environments, from high-traffic web
            applications to enterprise-scale APIs. Experience lightning-fast
            data retrieval, intelligent memory management, and seamless
            integration with your existing technology stack.
          </p>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-blue-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Intelligent Cache Management
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Lazy caching with random TTL (5-15 min) to prevent cache stampede,
              selective cache invalidation per collection, and automatic index
              cache cleanup for memory optimization in production environments.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-purple-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Chainable Query Methods
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Execute sophisticated cache queries with fluent API methods
              designed for real-time data retrieval and filtering.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-3 py-1 rounded-lg text-purple-300 font-semibold border border-purple-800 text-sm">
                .query()
              </code>
              <code className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-3 py-1 rounded-lg text-purple-300 font-semibold border border-purple-800 text-sm">
                .Sort()
              </code>
              <code className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-3 py-1 rounded-lg text-purple-300 font-semibold border border-purple-800 text-sm">
                .Limit()
              </code>
              <code className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-3 py-1 rounded-lg text-purple-300 font-semibold border border-purple-800 text-sm">
                .Skip()
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-orange-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 to-red-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                High-Performance Data Layer
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Purpose-built for production caching with optimized I/O
              operations, intelligent buffering, and sub-millisecond response
              times for frequently accessed data.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-green-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Secure Cache Storage
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Enterprise-grade encryption for sensitive cached data including
              user sessions, API responses, and confidential application state
              with automatic key rotation.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-cyan-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Advanced Aggregation Pipelines
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Execute sophisticated data processing workflows with
              MongoDB-compatible aggregation operations for comprehensive
              business intelligence and analytics.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-800 text-sm">
                $match
              </code>
              <code className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-800 text-sm">
                $group
              </code>
              <code className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-800 text-sm">
                $sort
              </code>
              <code className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-800 text-sm">
                $project
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-yellow-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-amber-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Intelligent Memory Caching
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Dramatically accelerate query performance with our intelligent
              in-memory caching system, delivering sub-millisecond response
              times for frequently accessed data and optimized resource
              utilization.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-emerald-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-teal-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Zero-Configuration Setup
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Get started instantly with our serverless architecture—no complex
              installations, database servers, or lengthy configurations
              required. Simply install and begin building your application
              immediately.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-teal-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 to-cyan-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Tree-like Structure
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Store data in a hierarchical tree-like structure that enables
              efficient data retrieval, organization, and management with
              intuitive parent-child relationships.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-indigo-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Single Instance Architecture
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Ensures data consistency and security through a single instance
              pattern. Initialize one AxioDB instance and create unlimited
              databases, collections, and documents under unified management.
            </p>
            <code className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 px-3 py-2 rounded-lg text-indigo-300 font-semibold border border-indigo-800">
              new AxioDB()
            </code>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-violet-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Web-Based GUI Dashboard
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Automatically launches a comprehensive web-based management
              interface for visual database administration, query execution, and
              real-time monitoring.
            </p>
            <code className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 px-3 py-2 rounded-lg text-violet-300 font-semibold border border-violet-800">
              localhost:27018
            </code>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-rose-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Custom Field Indexing
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Create custom indexes on any field(s) using <code className="bg-slate-700 px-2 py-1 rounded text-rose-400 font-semibold">newIndex()</code> to dramatically boost query performance. Supports single and multi-field indexes for optimized lookups, range queries, sorting, and filtering operations.
            </p>
            <div className="bg-rose-900/20 rounded-lg p-4 border border-rose-800">
              <code className="text-sm text-slate-300">
                collection.newIndex('email', 'age', 'name');
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-amber-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-orange-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Flexible Collection Configuration
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              Create collections with versatile configurations: basic
              collections, or encrypted collections with auto-generated or
              custom encryption keys.
            </p>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-emerald-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-green-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Bulk Operations Support
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Handle massive datasets efficiently with high-performance bulk
              operations that significantly reduce overhead and improve
              throughput for large-scale data operations.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 px-3 py-1 rounded-lg text-emerald-300 font-semibold border border-emerald-800 text-sm">
                insertMany()
              </code>
              <code className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 px-3 py-1 rounded-lg text-emerald-300 font-semibold border border-emerald-800 text-sm">
                UpdateMany()
              </code>
              <code className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 px-3 py-1 rounded-lg text-emerald-300 font-semibold border border-emerald-800 text-sm">
                DeleteMany()
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-sky-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Advanced Query Operators
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Comprehensive MongoDB-compatible query operators for sophisticated
              data filtering, matching, and retrieval operations with familiar
              syntax and powerful capabilities.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-sky-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-sky-300 font-semibold border border-sky-800 text-sm">
                $gt
              </code>
              <code className="bg-gradient-to-r from-sky-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-sky-300 font-semibold border border-sky-800 text-sm">
                $lt
              </code>
              <code className="bg-gradient-to-r from-sky-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-sky-300 font-semibold border border-sky-800 text-sm">
                $in
              </code>
              <code className="bg-gradient-to-r from-sky-900/50 to-blue-900/50 px-3 py-1 rounded-lg text-sky-300 font-semibold border border-sky-800 text-sm">
                $regex
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-indigo-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Built-in Web GUI
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Enable the built-in web interface to visualize and inspect your databases.
              Perfect for Electron apps—give your users a database inspector without
              extra dependencies. Runs on localhost:27018.
            </p>
            <code className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 px-3 py-2 rounded-lg text-indigo-300 font-semibold border border-indigo-800">
              new AxioDB(&#123; GUI: true &#125;) // Enable GUI
            </code>
          </div>
        </div>

        <div className="group relative bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-700 hover:border-lime-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-900/10 to-green-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-lime-500 to-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Custom Database Path
              </h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              Define custom storage locations for your databases with flexible
              path configuration, enabling better project organization and
              deployment flexibility across different environments.
            </p>
            <code className="bg-gradient-to-r from-lime-900/50 to-green-900/50 px-3 py-2 rounded-lg text-lime-300 font-semibold border border-lime-800">
              new AxioDB(&#123; GUI: true, RootName: "MyDB", CustomPath: "./custom/path" &#125;)
            </code>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Features;
