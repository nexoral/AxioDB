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
        description="Explore AxioDB's caching, indexing, transactions, and GUI features for embedded Node.js applications."
        path="/features"
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 border border-emerald-200 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-green-600">
                Production Caching Features
              </h1>
              <p className="text-xl text-gray-600 font-light mt-2">
                Advanced caching capabilities for modern production environments
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
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
        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-accent-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Intelligent Cache Management
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Lazy caching with random TTL (5-15 min) to prevent cache stampede,
              selective cache invalidation per collection, and automatic index
              cache cleanup for memory optimization in production environments.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-purple-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Chainable Query Methods
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Execute sophisticated cache queries with fluent API methods
              designed for real-time data retrieval and filtering.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-accent-50 px-3 py-1 rounded-lg text-purple-700 font-semibold border border-purple-200 text-sm">
                .query()
              </code>
              <code className="bg-accent-50 px-3 py-1 rounded-lg text-purple-700 font-semibold border border-purple-200 text-sm">
                .Sort()
              </code>
              <code className="bg-accent-50 px-3 py-1 rounded-lg text-purple-700 font-semibold border border-purple-200 text-sm">
                .Limit()
              </code>
              <code className="bg-accent-50 px-3 py-1 rounded-lg text-purple-700 font-semibold border border-purple-200 text-sm">
                .Skip()
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-orange-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                High-Performance Data Layer
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Purpose-built for production caching with optimized I/O
              operations, intelligent buffering, and sub-millisecond response
              times for frequently accessed data.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-green-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Secure Cache Storage
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              In-memory caching reduces disk reads for user sessions, API
              responses, and application state, minimizing exposure of
              sensitive data to unnecessary I/O.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-cyan-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-sky-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-cyan-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Advanced Aggregation Pipelines
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Execute sophisticated data processing workflows with
              60+ MongoDB-compatible aggregation stages including
              cross-collection joins, multi-facet analysis, and custom operators.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-200 text-sm">
                $lookup
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-200 text-sm">
                $facet
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-200 text-sm">
                $group
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-200 text-sm">
                $bucket
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-cyan-300 font-semibold border border-cyan-200 text-sm">
                OperatorRegistry
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-yellow-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-yellow-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Intelligent Memory Caching
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Dramatically accelerate query performance with our intelligent
              in-memory caching system, delivering sub-millisecond response
              times for frequently accessed data and optimized resource
              utilization.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-emerald-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Zero-Configuration Setup
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Get started instantly with our serverless architecture—no complex
              installations, database servers, or lengthy configurations
              required. Simply install and begin building your application
              immediately.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-teal-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-teal-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Tree-like Structure
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Store data in a hierarchical tree-like structure that enables
              efficient data retrieval, organization, and management with
              intuitive parent-child relationships.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-fuchsia-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-fuchsia-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Single Instance Architecture
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Ensures data consistency and security through a single instance
              pattern. Initialize one AxioDB instance and create unlimited
              databases, collections, and documents under unified management.
            </p>
            <code className="bg-accent-50 px-3 py-2 rounded-lg text-fuchsia-600 font-semibold border border-fuchsia-200">
              new AxioDB()
            </code>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-violet-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-violet-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-violet-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Web-Based GUI Dashboard
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Automatically launches a comprehensive web-based management
              interface for visual database administration, query execution, and
              real-time monitoring.
            </p>
            <code className="bg-violet-50 px-3 py-2 rounded-lg text-violet-300 font-semibold border border-violet-200">
              localhost:27018
            </code>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-rose-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Custom Field Indexing
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Create custom indexes on any field(s) using <code className="bg-gray-200 px-2 py-1 rounded text-rose-400 font-semibold">newIndex()</code> to dramatically boost query performance. Supports single and multi-field indexes for optimized lookups, range queries, sorting, and filtering operations.
            </p>
            <div className="bg-rose-100/20 rounded-lg p-4 border border-rose-200">
              <code className="text-sm text-gray-600">
                collection.newIndex('email', 'age', 'name');
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-amber-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Flexible Collection Configuration
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Create collections with a single call - schema-less by default,
              or with optional schema validation when you need structure.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-emerald-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Bulk Operations Support
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Handle massive datasets efficiently with high-performance bulk
              operations that significantly reduce overhead and improve
              throughput for large-scale data operations.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-green-50 px-3 py-1 rounded-lg text-emerald-700 font-semibold border border-emerald-200 text-sm">
                insertMany()
              </code>
              <code className="bg-green-50 px-3 py-1 rounded-lg text-emerald-700 font-semibold border border-emerald-200 text-sm">
                UpdateMany()
              </code>
              <code className="bg-green-50 px-3 py-1 rounded-lg text-emerald-700 font-semibold border border-emerald-200 text-sm">
                DeleteMany()
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-sky-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-sky-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-sky-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Advanced Query Operators
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Comprehensive MongoDB-compatible query operators for sophisticated
              data filtering, matching, and retrieval operations with familiar
              syntax and powerful capabilities.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-sky-700 font-semibold border border-sky-200 text-sm">
                $gt
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-sky-700 font-semibold border border-sky-200 text-sm">
                $lt
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-sky-700 font-semibold border border-sky-200 text-sm">
                $in
              </code>
              <code className="bg-sky-50 px-3 py-1 rounded-lg text-sky-700 font-semibold border border-sky-200 text-sm">
                $regex
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-fuchsia-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-fuchsia-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Built-in Web GUI
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Enable the built-in web interface to visualize and inspect your databases.
              Perfect for Electron apps—give your users a database inspector without
              extra dependencies. Runs on localhost:27018.
            </p>
            <code className="bg-accent-50 px-3 py-2 rounded-lg text-fuchsia-600 font-semibold border border-fuchsia-200">
              new AxioDB(&#123; GUI: true &#125;) // Enable GUI
            </code>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-lime-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-lime-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Custom Database Path
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              Define custom storage locations for your databases with flexible
              path configuration, enabling better project organization and
              deployment flexibility across different environments.
            </p>
            <code className="bg-green-50 px-3 py-2 rounded-lg text-lime-300 font-semibold border border-lime-200">
              new AxioDB(&#123; GUI: true, RootName: "MyDB", CustomPath: "./custom/path" &#125;)
            </code>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Features;
