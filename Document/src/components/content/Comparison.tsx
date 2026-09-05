import { ArrowRight, Check, GitCompare, X, Zap, AlertTriangle, Skull, RefreshCw } from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";

const Comparison: React.FC = () => {
  return (
    <section id="comparison" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB vs SQLite, LowDB, NeDB - Embedded Database Comparison"
        description="Why AxioDB is the best embedded JavaScript database. Feature-by-feature comparison against SQLite, LowDB, NeDB, better-sqlite3, and JSON files."
        path="/comparison"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-50 to-purple-50 rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-accent-200 shadow-md animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100/40 rounded-full blur-3xl animate-blob-drift"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-600 rounded-lg animate-glow">
              <GitCompare className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm bg-accent-100 text-accent-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              Head-to-Head
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900 leading-tight">
            AxioDB vs The Competition
          </h1>
          <p className="text-xl text-gray-600 font-light max-w-4xl">
            Stop using abandoned, broken, or overkill databases.
            See why AxioDB is the right choice for embedded JavaScript applications.
          </p>
        </div>
      </div>

      {/* The Graveyard - Abandoned Competitors */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Skull className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">The Abandoned</h2>
          <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">No Maintenance</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* NeDB */}
          <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💀</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">NeDB</h3>
                  <span className="text-sm text-gray-500">13.5k GitHub stars</span>
                </div>
              </div>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                ABANDONED
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Last meaningful update: 2016. No security patches, no bug fixes, no new features.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Data loss reported by multiple users</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>File corruption on concurrent access</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Security vulnerabilities unpatched</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No TypeScript support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Callback-based API (no Promises)</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                <Check className="h-4 w-4" />
                <span>AxioDB alternative: Active, TypeScript, ACID, Promises</span>
              </div>
            </div>
          </div>

          {/* LokiJS */}
          <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪦</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">LokiJS</h3>
                  <span className="text-sm text-gray-500">6.8k GitHub stars</span>
                </div>
              </div>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                ABANDONED
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              In-memory database with optional persistence. No active development.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>In-memory only — RAM limits scale</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No ACID transactions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Persistence is afterthought</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No built-in GUI or TCP access</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                <Check className="h-4 w-4" />
                <span>AxioDB alternative: File-based, persistent, scalable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Painful - Active but problematic */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900">The Painful</h2>
          <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Active but problematic</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LowDB */}
          <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">LowDB</h3>
                  <span className="text-sm text-gray-500">22.6k GitHub stars</span>
                </div>
              </div>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                STALE (3yr)
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Simple JSON file database. Great for prototypes, dangerous for production.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No concurrency — multi-process = data corruption</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No ACID — crash during write = corrupt JSON</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Entire DB loaded into memory — RAM limits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Full file rewrite on every change — disk wear</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No indexing — O(n) queries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No built-in caching</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                <Check className="h-4 w-4" />
                <span>AxioDB alternative: File-per-doc, ACID, indexed, cached</span>
              </div>
            </div>
          </div>

          {/* better-sqlite3 */}
          <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔧</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">better-sqlite3</h3>
                  <span className="text-sm text-gray-500">3M+ weekly downloads</span>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                ACTIVE
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Fastest SQLite driver for Node.js. But requires native C compilation.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Native C bindings — requires node-gyp compilation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>electron-rebuild required for Electron apps</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Platform-specific builds (Windows ≠ Mac ≠ Linux)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>SQL strings instead of JavaScript objects</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>Schema migrations required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="h-4 w-4" />
                <span>No built-in GUI</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                <Check className="h-4 w-4" />
                <span>AxioDB alternative: Pure JS, no compilation, NoSQL queries</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-6 w-6 text-accent-600" />
          <h2 className="text-2xl font-bold text-gray-900">Feature Comparison Matrix</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-6 py-4 text-left font-bold">Feature</th>
                <th className="px-4 py-4 text-center font-bold bg-accent-700">AxioDB</th>
                <th className="px-4 py-4 text-center font-bold">LowDB</th>
                <th className="px-4 py-4 text-center font-bold">NeDB</th>
                <th className="px-4 py-4 text-center font-bold">better-sqlite3</th>
                <th className="px-4 py-4 text-center font-bold">JSON Files</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">Status</td>
                <td className="px-4 py-3 text-center bg-accent-50"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span></td>
                <td className="px-4 py-3 text-center"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">Stale</span></td>
                <td className="px-4 py-3 text-center"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Abandoned</span></td>
                <td className="px-4 py-3 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span></td>
                <td className="px-4 py-3 text-center"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">N/A</span></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-6 py-3 font-semibold text-gray-700">Zero Native Dependencies</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">ACID Transactions</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-6 py-3 font-semibold text-gray-700">TypeScript Support</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">Built-in Caching</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-6 py-3 font-semibold text-gray-700">Worker Threads</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">Built-in GUI</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-6 py-3 font-semibold text-gray-700">TCP Remote Access</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">MCP Server (AI)</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-6 py-3 font-semibold text-gray-700">File-per-Document</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">Atomic Writes</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-6 py-3 font-semibold text-gray-700">MongoDB-Style Queries</td>
                <td className="px-4 py-3 text-center bg-accent-50"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                <td className="px-4 py-3 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700">Best For</td>
                <td className="px-4 py-3 text-center bg-accent-50 text-accent-700 font-semibold">Electron, CLI, 10K-500K docs</td>
                <td className="px-4 py-3 text-center text-gray-600">Prototypes only</td>
                <td className="px-4 py-3 text-center text-gray-600">Nothing (abandoned)</td>
                <td className="px-4 py-3 text-center text-gray-600">Server-side SQLite</td>
                <td className="px-4 py-3 text-center text-gray-600">Config files</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Migration Guide */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 sm:p-8 mb-12 border border-green-200 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Switch in 5 Minutes</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* From LowDB */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📄</span>
              <span className="font-bold text-gray-900">From LowDB</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 mb-1 font-medium">Before (LowDB):</p>
                <code className="text-red-600 font-mono text-xs">
                  {`const db = await JSONFilePreset('db.json', {})\ndb.data.posts.push(post)\nawait db.write()`}
                </code>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-green-600 mb-1 font-medium">After (AxioDB):</p>
                <code className="text-green-700 font-mono text-xs">
                  {`const db = new AxioDB()\nconst myDB = await db.createDB('app')\nconst posts = await myDB.createCollection('posts')\nawait posts.insert(post)`}
                </code>
              </div>
            </div>
          </div>

          {/* From NeDB */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💀</span>
              <span className="font-bold text-gray-900">From NeDB</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 mb-1 font-medium">Before (NeDB):</p>
                <code className="text-red-600 font-mono text-xs">
                  {`const Datastore = require('nedb')\nconst db = new Datastore()\ndb.insert(doc, callback)`}
                </code>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-green-600 mb-1 font-medium">After (AxioDB):</p>
                <code className="text-green-700 font-mono text-xs">
                  {`const db = new AxioDB()\nconst myDB = await db.createDB('app')\nconst col = await myDB.createCollection('data')\nawait col.insert(doc)`}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/installation"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-md transform hover:-translate-y-0.5"
          >
            Install AxioDB Now
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Performance Benchmark */}
      <div className="bg-gray-900 rounded-xl p-6 sm:p-8 mb-12 shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-white">
          Performance Benchmark (50,000 documents)
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-accent-400 mb-2">~1ms</div>
            <div className="text-lg font-semibold text-white">AxioDB</div>
            <div className="text-sm text-gray-400">Indexed query</div>
            <div className="mt-2 text-xs text-green-400 font-semibold">O(1) with cache</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-orange-400 mb-2">~1.2s</div>
            <div className="text-lg font-semibold text-white">Full scan</div>
            <div className="text-sm text-gray-400">10K of 50K docs</div>
            <div className="mt-2 text-xs text-orange-400 font-semibold">O(n) linear</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-gray-400 mb-2">N/A</div>
            <div className="text-lg font-semibold text-white">NeDB</div>
            <div className="text-sm text-gray-400">Abandoned</div>
            <div className="mt-2 text-xs text-red-400 font-semibold">Not recommended</div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Ready to Switch?
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Join developers who moved from LowDB, NeDB, and better-sqlite3 to AxioDB.
          Zero native dependencies. ACID transactions. Built-in caching and GUI.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/installation"
            className="inline-flex items-center gap-2 bg-accent-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            npm install axiodb
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="/usage"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
          >
            Read the Docs
          </a>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
