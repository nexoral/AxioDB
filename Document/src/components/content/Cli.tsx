import {
  ArrowRight,
  Command,
  Download,
  Terminal,
  Shield,
  Zap,
  Server,
  Globe,
} from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const INSTALL_LINUX = `# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | bash`;

const INSTALL_WINDOWS = `# Windows (PowerShell)
irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex`;

const USAGE_SINGLE = `# Test connection
axiodb -c axiodb://127.0.0.1:27019 ping

# List databases
axiodb -c axiodb://127.0.0.1:27019 db list

# Insert a document
axiodb -c axiodb://127.0.0.1:27019 document insert '{"name":"Alice","age":30}' \\
  --db mydb --collection users

# Query documents
axiodb -c axiodb://127.0.0.1:27019 document query '{"age":{"$gt":25}}' \\
  --db mydb --collection users --output json`;

const USAGE_REPL = `# Start interactive shell
axiodb connect

# MongoDB shell syntax
axiodb> use mydb
axiodb:mydb> show collections
axiodb:mydb> use mydb.users
axiodb:mydb:users> db.users.find({})
axiodb:mydb:users> db.users.insert({name: "Bob", age: 25})
axiodb:mydb:users> db.users.updateOne({name: "Bob"}, {$set: {age: 26}})
axiodb:mydb:users> db.users.deleteOne({name: "Bob"})
axiodb:mydb:users> exit`;

const CliPage: React.FC = () => {
  const heroReveal = useScrollReveal<HTMLDivElement>();
  const installReveal = useScrollReveal<HTMLDivElement>();
  const usageReveal = useScrollReveal<HTMLDivElement>();
  const featuresReveal = useScrollReveal<HTMLDivElement>();
  const platformsReveal = useScrollReveal<HTMLDivElement>();

  return (
    <section id="cli" className="scroll-mt-20">
      <Seo
        title="AxioDB CLI - Command Line Interface"
        description="Go-based CLI tool for AxioDB. Interactive REPL with MongoDB shell syntax, all TCP commands, TLS support, 12 platform builds."
        path="/cli"
      />

      {/* Hero */}
      <div
        ref={heroReveal.ref}
        className={`relative overflow-hidden bg-white rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-gray-200 shadow-md reveal-on-scroll ${heroReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Command className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full font-bold">
                NEW
              </span>
              <span>Go-based CLI</span>
              <span>•</span>
              <span>12 Platforms</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
            AxioDB CLI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 max-w-3xl">
            Command line interface for AxioDB. Connect to any AxioDB server via TCP,
            run queries, manage databases — all from your terminal with MongoDB shell syntax.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <Terminal className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Interactive REPL</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">TLS Support</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">21 Commands</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <Globe className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">12 Platforms</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/nexoral/AxioDB/releases?q=cli-v&expanded=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg transition-all"
            >
              <Download className="h-5 w-5" />
              Download
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/nexoral/AxioDB/tree/main/cli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              <Server className="h-5 w-5" />
              Source Code
            </a>
          </div>
        </div>
      </div>

      {/* Quick Install */}
      <div
        ref={installReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${installReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Install</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Linux / macOS</p>
            <CodeBlock code={INSTALL_LINUX} language="bash" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Windows (PowerShell)</p>
            <CodeBlock code={INSTALL_WINDOWS} language="powershell" />
          </div>
        </div>
      </div>

      {/* Usage */}
      <div
        ref={usageReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${usageReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Single Commands</h3>
          <CodeBlock code={USAGE_SINGLE} language="bash" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Interactive REPL (MongoDB Shell Style)</h3>
          <CodeBlock code={USAGE_REPL} language="bash" />
        </div>
      </div>

      {/* Features */}
      <div
        ref={featuresReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${featuresReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "All 21 TCP Commands", desc: "Database, collection, document CRUD, aggregation, indexing" },
            { title: "Interactive REPL", desc: "MongoDB shell syntax — use, show dbs, db.coll.find()" },
            { title: "TLS Support", desc: "--tls, --tls-cert, --tls-skip-verify flags" },
            { title: "Authentication", desc: "-u / -p flags for TCP auth" },
            { title: "JSON Output", desc: "--output json for scripting and piping" },
            { title: "Tab Autocomplete", desc: "Command completion in REPL mode" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-gray-800">{f.title}</p>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Platforms */}
      <div
        ref={platformsReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${platformsReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Supported Platforms</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">OS</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Architectures</th>
              </tr>
            </thead>
            <tbody>
              {[
                { os: "Linux", arch: "amd64, arm64, 386, armv7" },
                { os: "macOS", arch: "amd64 (Intel), arm64 (Apple Silicon)" },
                { os: "Windows", arch: "amd64, arm64, 386" },
                { os: "FreeBSD", arch: "amd64" },
                { os: "OpenBSD", arch: "amd64" },
                { os: "NetBSD", arch: "amd64" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium text-gray-800">{row.os}</td>
                  <td className="py-2 px-3 text-gray-600">{row.arch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default CliPage;
