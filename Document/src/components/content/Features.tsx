import {
  BarChart3,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Download,
  FilterX,
  Layers,
  Lock,
  Search,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import React from "react";

const Features: React.FC = () => {
  return (
    <section id="features" className="pt-12 scroll-mt-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-emerald-900/20 dark:via-slate-800 dark:to-green-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-emerald-200 dark:border-emerald-800 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-400/10 to-green-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-teal-700 dark:from-emerald-200 dark:via-green-300 dark:to-teal-200 bg-clip-text text-transparent">
                Production Caching Features
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                Advanced caching capabilities for modern production environments
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
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
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Intelligent Cache Management
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Automated cache lifecycle management with smart eviction policies,
              TTL support, and memory optimization ensuring optimal performance
              in production environments.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Chainable Query Methods
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Execute sophisticated cache queries with fluent API methods
              designed for real-time data retrieval and filtering.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 px-3 py-1 rounded-lg text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-sm">
                .query()
              </code>
              <code className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 px-3 py-1 rounded-lg text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-sm">
                .Sort()
              </code>
              <code className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 px-3 py-1 rounded-lg text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-sm">
                .Limit()
              </code>
              <code className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 px-3 py-1 rounded-lg text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-sm">
                .Skip()
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                High-Performance Data Layer
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Purpose-built for production caching with optimized I/O
              operations, intelligent buffering, and sub-millisecond response
              times for frequently accessed data.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Secure Cache Storage
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Enterprise-grade encryption for sensitive cached data including
              user sessions, API responses, and confidential application state
              with automatic key rotation.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Advanced Aggregation Pipelines
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Execute sophisticated data processing workflows with
              MongoDB-compatible aggregation operations for comprehensive
              business intelligence and analytics.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-200 dark:border-cyan-800 text-sm">
                $match
              </code>
              <code className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-200 dark:border-cyan-800 text-sm">
                $group
              </code>
              <code className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-200 dark:border-cyan-800 text-sm">
                $sort
              </code>
              <code className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-200 dark:border-cyan-800 text-sm">
                $project
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Intelligent Memory Caching
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Dramatically accelerate query performance with our intelligent
              in-memory caching system, delivering sub-millisecond response
              times for frequently accessed data and optimized resource
              utilization.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Zero-Configuration Setup
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Get started instantly with our serverless architecture—no complex
              installations, database servers, or lengthy configurations
              required. Simply install and begin building your application
              immediately.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Tree-like Structure
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Store data in a hierarchical tree-like structure that enables
              efficient data retrieval, organization, and management with
              intuitive parent-child relationships.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Single Instance Architecture
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Ensures data consistency and security through a single instance
              pattern. Initialize one AxioDB instance and create unlimited
              databases, collections, and documents under unified management.
            </p>
            <code className="bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 px-3 py-2 rounded-lg text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              new AxioDB()
            </code>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Web-Based GUI Dashboard
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Automatically launches a comprehensive web-based management
              interface for visual database administration, query execution, and
              real-time monitoring.
            </p>
            <code className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 px-3 py-2 rounded-lg text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800">
              localhost:27018
            </code>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Auto Indexing on documentId
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Automatically creates optimized indexes on document IDs for
              lightning-fast queries and retrieval operations without requiring
              manual configuration or maintenance.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Flexible Collection Configuration
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Create collections with versatile configurations: basic
              collections, encrypted collections with auto-generated or custom
              keys, schema-only collections, or collections with both encryption
              and comprehensive schema validation.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Bulk Operations Support
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Handle massive datasets efficiently with high-performance bulk
              operations that significantly reduce overhead and improve
              throughput for large-scale data operations.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 px-3 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 text-sm">
                insertMany()
              </code>
              <code className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 px-3 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 text-sm">
                UpdateMany()
              </code>
              <code className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 px-3 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 text-sm">
                DeleteMany()
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Advanced Query Operators
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Comprehensive MongoDB-compatible query operators for sophisticated
              data filtering, matching, and retrieval operations with familiar
              syntax and powerful capabilities.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800 text-sm">
                $gt
              </code>
              <code className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800 text-sm">
                $lt
              </code>
              <code className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800 text-sm">
                $in
              </code>
              <code className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 px-3 py-1 rounded-lg text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800 text-sm">
                $regex
              </code>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Built-in Web GUI
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Enable the built-in web interface to visualize and inspect your databases.
              Perfect for Electron apps—give your users a database inspector without
              extra dependencies. Runs on localhost:27018.
            </p>
            <code className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 px-3 py-2 rounded-lg text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              new AxioDB(true) // Enable GUI
            </code>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-lime-300 dark:hover:border-lime-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-900/10 dark:to-green-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-lime-500 to-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Custom Database Path
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
              Define custom storage locations for your databases with flexible
              path configuration, enabling better project organization and
              deployment flexibility across different environments.
            </p>
            <code className="bg-gradient-to-r from-lime-100 to-green-100 dark:from-lime-900/50 dark:to-green-900/50 px-3 py-2 rounded-lg text-lime-700 dark:text-lime-300 font-semibold border border-lime-200 dark:border-lime-800">
              new AxioDB(true, "MyDB", "./custom/path")
            </code>
          </div>
        </div>
      </div>

      <section id="limitations" className="pt-12 scroll-mt-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-900/20 dark:via-slate-800 dark:to-red-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-orange-200 dark:border-orange-800 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                <FilterX className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-800 via-red-700 to-pink-700 dark:from-orange-200 dark:via-red-300 dark:to-pink-200 bg-clip-text text-transparent">
                  Limitations & Scale Considerations
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                  Understanding AxioDB's design scope
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              AxioDB is designed for embedded applications with 10K-500K documents.
              For different requirements, consider these alternatives.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-sm mb-8">
          <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-4">
            Scale & Performance Boundaries
          </h3>

          <ul className="space-y-4 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">
                  Dataset Size:
                </strong>{" "}
                Optimized for 10K-500K documents. For 10M+ documents, use PostgreSQL,
                MongoDB, or SQLite which are designed for massive scale.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">
                  Concurrency:
                </strong>{" "}
                Single-instance architecture. For multi-user web applications with
                hundreds of concurrent connections, use traditional client-server databases.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">
                  Relational Data:
                </strong>{" "}
                Document-based NoSQL architecture. No JOIN operations. For complex
                relational data with foreign keys and constraints, use SQL databases.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">
                  Distributed Systems:
                </strong>{" "}
                Single-node only. No replication, no sharding, no clustering. For
                distributed systems, use MongoDB or CouchDB.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">
                  Transactions:
                </strong>{" "}
                No ACID transactions across multiple collections. For transaction
                requirements, use PostgreSQL or MongoDB with transactions enabled.
              </div>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-blue-800 dark:text-blue-200">
                When to Use AxioDB:
              </strong>{" "}
              Desktop apps, CLI tools, embedded systems, prototyping, and local-first
              applications with moderate data needs. Think SQLite-scale with MongoDB-style
              queries and built-in caching.
            </p>
          </div>
        </div>
      </section>

      <section id="future-plans" className="pt-12 scroll-mt-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-purple-200 dark:border-purple-800 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                <Layers className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 dark:from-purple-200 dark:via-indigo-300 dark:to-blue-200 bg-clip-text text-transparent">
                  Innovation Roadmap
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                  Pioneering the future of database technology
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              Our development roadmap focuses on cutting-edge innovations that
              will position AxioDB as the premier choice for next-generation
              applications. We're committed to continuous enhancement and
              staying ahead of industry trends while maintaining our core
              principles of simplicity and performance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Data Export & Import
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                Seamless data migration capabilities with support for multiple
                formats including JSON, CSV, and native AxioDB formats for
                comprehensive data portability.
              </p>
            </div>
          </div>

          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Code2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Comprehensive Documentation
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                Extensive tutorials, interactive examples, and complete API
                references designed for developers at every skill level and
                experience.
              </p>
            </div>
          </div>

          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transform hover:-translate-y-1 md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Enhanced Web-Based GUI Dashboard
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-4">
                Advanced web-based interface with real-time analytics, visual
                query builder, performance monitoring, and comprehensive
                database management tools. Already available at{" "}
                <code className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 px-3 py-1 rounded-lg text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800">
                  localhost:27018
                </code>{" "}
                when you run AxioDB.
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Features;
