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

const INSTALL_LINUX = `curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | bash`;

const INSTALL_WINDOWS = `irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex`;

const CONNECTION_STRING = `# Format: axiodb://host:port

# Local server (default)
axiodb://localhost:27019

# Remote server
axiodb://192.168.1.100:27019

# Custom domain
axiodb://mydb.example.com:27019`;

const USAGE_SINGLE = `# Test connection
axiodb -c axiodb://127.0.0.1:27019 ping

# Check service health
axiodb -c axiodb://127.0.0.1:27019 health

# List databases
axiodb -c axiodb://127.0.0.1:27019 db list

# Insert a document
axiodb -c axiodb://127.0.0.1:27019 document insert '{"name":"Alice","age":30}' \\
  --db mydb --collection users

# Query documents (JSON output)
axiodb -c axiodb://127.0.0.1:27019 document query '{"age":{"$gt":25}}' \\
  --db mydb --collection users --output json

# Query using an index hint
axiodb -c axiodb://127.0.0.1:27019 document query '{"email":"alice@example.com"}' \\
  --db mydb --collection users --hint email

# Find several documents by ID
axiodb -c axiodb://127.0.0.1:27019 document find-by-ids '["id1","id2"]' \\
  --db mydb --collection users

# With authentication
axiodb -c axiodb://127.0.0.1:27019 -u admin -p secret db list

# With TLS
axiodb -c axiodb://127.0.0.1:27019 --tls --tls-cert ./cert.pem db list

# Using --host and --port instead of connection string
axiodb --host 192.168.1.100 --port 27019 ping`;

const USAGE_REPL = `# Start with connection string
axiodb connect -c axiodb://127.0.0.1:27019

# Start with auth
axiodb connect -c axiodb://127.0.0.1:27019 -u admin -p secret

# Start with TLS
axiodb connect -c axiodb://127.0.0.1:27019 --tls --tls-cert ./cert.pem

# Start with host/port flags (no connection string)
axiodb connect --host 192.168.1.100 --port 27019

# Start with defaults (localhost:27019)
axiodb connect

# Once connected — MongoDB shell syntax:
axiodb> use mydb
axiodb:mydb> show dbs
axiodb:mydb> show collections
axiodb:mydb> use mydb.users
axiodb:mydb:users> db.users.find({})
axiodb:mydb:users> db.users.find({age: {\$gt: 25}})
axiodb:mydb:users> db.users.insert({name: "Bob", age: 25})
axiodb:mydb:users> db.users.updateOne({name: "Bob"}, {\$set: {age: 26}})
axiodb:mydb:users> db.users.deleteOne({name: "Bob"})
axiodb:mydb:users> db.users.countDocuments()
axiodb:mydb:users> exit`;

const USAGE_EXPORT_IMPORT = `# Export database (saves mydb.tar.gz in current directory)
axiodb export mydb \\
  --http-host localhost --http-port 27018 \\
  -u admin -p secret

# Export from remote server
axiodb export mydb \\
  --http-host prod.example.com --http-port 27018 \\
  -u admin -p secret

# Import database from file (tab completes .tar.gz files)
axiodb import ./backups/mydb.tar.gz \\
  --http-host localhost --http-port 27018 \\
  -u admin -p secret

# Import overwrites if database already exists — delete first via GUI or CLI
axiodb db delete mydb -c axiodb://localhost:27019 -u admin -p secret
axiodb import ./backups/mydb.tar.gz \\
  --http-host localhost --http-port 27018 \\
  -u admin -p secret`;

const USAGE_ADMIN = `# User and role administration uses the HTTP API (port 27018)
axiodb user list --http-host localhost --http-port 27018 -u admin -p secret
axiodb user create analyst analyst123 View --http-host localhost --http-port 27018 -u admin -p secret
axiodb role list --http-host localhost --http-port 27018 -u admin -p secret
axiodb role create Auditor document:view,document:query --http-host localhost --http-port 27018 -u admin -p secret`;

const USAGE_TRANSACTION = `# Run transaction steps from a JSON file on one TCP connection
cat > transfer.json <<'EOF'
[
  {"operation":"update-by-id","id":"sender","updateData":{"balance":500}},
  {"operation":"update-by-id","id":"receiver","updateData":{"balance":1500}},
  {"operation":"savepoint","savepointName":"checked"}
]
EOF

axiodb transaction run transfer.json --db mydb --collection accounts \\
  -c axiodb://127.0.0.1:27019 -u admin -p secret`;

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
        description="CLI tool for AxioDB. Connection string format, global flags reference, interactive REPL with MongoDB shell syntax, TLS encryption, TCP authentication, 12 platform builds."
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
              <span>AxDB CLI</span>
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
              <span className="text-sm font-semibold text-purple-700">CLI Commands</span>
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

      {/* Activation Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Server className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Enable HTTP & TCP on the server first</p>
            <p className="text-sm text-amber-700 mt-1">
              The CLI needs <code className="px-1 py-0.5 bg-white rounded">TCP 27019</code> enabled (<code className="px-1 py-0.5 bg-white rounded">new AxioDB(&#123; TCP: true &#125;)</code> or <code className="px-1 py-0.5 bg-white rounded">AXIODB_TCP=true</code>) for data commands: <code className="px-1 py-0.5 bg-white rounded">db</code>, <code className="px-1 py-0.5 bg-white rounded">collection</code>, <code className="px-1 py-0.5 bg-white rounded">document</code>, <code className="px-1 py-0.5 bg-white rounded">index</code>, <code className="px-1 py-0.5 bg-white rounded">transaction</code>, <code className="px-1 py-0.5 bg-white rounded">ping</code>, <code className="px-1 py-0.5 bg-white rounded">health</code>, <code className="px-1 py-0.5 bg-white rounded">connect</code>.
              Management commands (<code className="px-1 py-0.5 bg-white rounded">user</code>, <code className="px-1 py-0.5 bg-white rounded">role</code>, <code className="px-1 py-0.5 bg-white rounded">user change-password</code>, <code className="px-1 py-0.5 bg-white rounded">export</code>/<code className="px-1 py-0.5 bg-white rounded">import</code>) need <code className="px-1 py-0.5 bg-white rounded">HTTP 27018</code> enabled (<code className="px-1 py-0.5 bg-white rounded">GUI: true</code> / <code className="px-1 py-0.5 bg-white rounded">AXIODB_GUI=true</code>). TCP is data-plane only by design — no user/role management over TCP.
            </p>
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

      {/* Connection String */}
      <div
        ref={usageReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${usageReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection String</h2>

        <div className="mb-6">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mb-4">
            <p className="text-sm text-emerald-700 mb-2">
              <strong>Format:</strong> <code className="px-2 py-1 bg-white rounded font-mono">axiodb://host:port</code>
            </p>
            <p className="text-sm text-emerald-700">
              The CLI uses a custom <code className="px-1 py-0.5 bg-white rounded">axiodb://</code> scheme — not <code className="px-1 py-0.5 bg-white rounded">mongodb://</code> or <code className="px-1 py-0.5 bg-white rounded">http://</code>.
              Credentials and TLS are passed as separate flags, not embedded in the URL.
            </p>
          </div>
          <CodeBlock code={CONNECTION_STRING} language="text" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-1">Components</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><code className="px-1 py-0.5 bg-white rounded">axiodb://</code> — scheme (required, always this value)</li>
              <li><code className="px-1 py-0.5 bg-white rounded">host</code> — hostname or IP (required, default: <code>localhost</code>)</li>
              <li><code className="px-1 py-0.5 bg-white rounded">port</code> — TCP port (required, default: <code>27019</code>)</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-1">Not supported in URL</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>❌ Path segments (<code className="px-1 py-0.5 bg-white rounded">axiodb://host:27019/db</code>)</li>
              <li>❌ Query parameters (<code className="px-1 py-0.5 bg-white rounded">axiodb://host:27019?auth=true</code>)</li>
              <li>❌ Credentials (<code className="px-1 py-0.5 bg-white rounded">axiodb://user:pass@host:27019</code>)</li>
              <li>❌ TLS variant (<code className="px-1 py-0.5 bg-white rounded">axiodbs://</code>) — use <code>--tls</code> flag instead</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-700">
            <strong>MongoDB users:</strong> AxioDB&apos;s connection string is simpler than MongoDB&apos;s.
            There is no <code className="px-1 py-0.5 bg-white rounded">mongodb://</code> format, no replica set syntax, no auth source query params.
            Just <code className="px-1 py-0.5 bg-white rounded">axiodb://host:port</code> — all options go in flags.
          </p>
        </div>
      </div>

      {/* Global Flags */}
      <div className="bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Global Flags</h2>
        <p className="text-sm text-gray-600 mb-4">
          These flags work with all commands. Pass them before the subcommand or after it.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Flag</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Short</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Default</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { flag: "--connection-string", short: "-c", def: '""', desc: "Connection string (axiodb://host:port)" },
                { flag: "--host", short: "", def: "localhost", desc: "Server host" },
                { flag: "--port", short: "", def: "27019", desc: "Server port" },
                { flag: "--username", short: "-u", def: '""', desc: "Username for TCP authentication" },
                { flag: "--password", short: "-p", def: '""', desc: "Password for TCP authentication" },
                { flag: "--tls", short: "", def: "false", desc: "Enable TLS encryption" },
                { flag: "--tls-cert", short: "", def: '""', desc: "Path to CA certificate (for self-signed)" },
                { flag: "--tls-skip-verify", short: "", def: "false", desc: "Skip TLS certificate verification" },
                { flag: "--output", short: "-o", def: "table", desc: "Output format: table | json" },
                { flag: "--timeout", short: "", def: "30", desc: "Request timeout in seconds" },
                { flag: "--db", short: "", def: '""', desc: "Database name (for single commands)" },
                { flag: "--collection", short: "", def: '""', desc: "Collection name (for single commands)" },
                { flag: "--http-host", short: "", def: "localhost", desc: "HTTP server host (for export/import)" },
                { flag: "--http-port", short: "", def: "27018", desc: "HTTP server port (for export/import)" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-emerald-700">{row.flag}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-500">{row.short || "—"}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-500">{row.def}</td>
                  <td className="py-2 px-3 text-gray-600">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> <code className="px-1 py-0.5 bg-white rounded">-c</code> overrides <code className="px-1 py-0.5 bg-white rounded">--host</code> and <code className="px-1 py-0.5 bg-white rounded">--port</code> when both are provided.
            Auth flags (<code className="px-1 py-0.5 bg-white rounded">-u</code>/<code className="px-1 py-0.5 bg-white rounded">-p</code>) are only sent if the server has <code className="px-1 py-0.5 bg-white rounded">TCPAuth: true</code> enabled.
            Export/import use the HTTP API (port 27018) — <code className="px-1 py-0.5 bg-white rounded">--http-host</code> and <code className="px-1 py-0.5 bg-white rounded">--http-port</code> are separate from the TCP flags.
          </p>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Single Commands</h3>
          <CodeBlock code={USAGE_SINGLE} language="bash" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Interactive REPL (MongoDB Shell Style)</h3>
          <CodeBlock code={USAGE_REPL} language="bash" />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Export & Import (via HTTP API)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Export and import use the HTTP Dashboard API (port 27018), not the TCP protocol.
            They require <code className="px-1 py-0.5 bg-gray-100 rounded">-u</code>/<code className="px-1 py-0.5 bg-gray-100 rounded">-p</code> flags for HTTP session authentication.
            Tab completes <code className="px-1 py-0.5 bg-gray-100 rounded">.tar.gz</code> file paths automatically.
          </p>
          <CodeBlock code={USAGE_EXPORT_IMPORT} language="bash" />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">User & Role Administration (via HTTP API)</h3>
          <p className="text-sm text-gray-600 mb-3">Management commands use HTTP port 27018. The TCP protocol remains data-plane only.</p>
          <CodeBlock code={USAGE_ADMIN} language="bash" />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Transactions</h3>
          <p className="text-sm text-gray-600 mb-3">Transaction steps run in order on one TCP connection and commit together. Updates are flat merges; operators such as <code>$inc</code> are not supported.</p>
          <CodeBlock code={USAGE_TRANSACTION} language="bash" />
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
            { title: "TCP Data Operations", desc: "Database, collection, document CRUD, aggregation, indexing, counts, hints, find-by-IDs, and transactions" },
            { title: "Health & Diagnostics", desc: "Check TCP service health and retrieve instance information" },
            { title: "HTTP Administration", desc: "Manage users and roles without adding management commands to the TCP client" },
            { title: "Interactive REPL", desc: "MongoDB shell syntax with tab autocomplete" },
            { title: "Export & Import", desc: "Backup/restore databases via HTTP API, tab-completes file paths" },
            { title: "TLS Encryption", desc: "--tls, --tls-cert, --tls-skip-verify flags" },
            { title: "TCP Authentication", desc: "-u / -p flags, shared RBAC with GUI" },
            { title: "JSON & Table Output", desc: "--output json for scripting, --output table for reading" },
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

      {/* Version Compatibility */}
      <div className="bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Version Compatibility</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">CLI Version</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Server Version</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Protocol</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cli: "cli-v1.x", server: "AxioDB >= 15.0.0", protocol: "TCP (port 27019)" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-emerald-700">{row.cli}</td>
                  <td className="py-2 px-3 text-gray-600">{row.server}</td>
                  <td className="py-2 px-3 text-gray-600">{row.protocol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The CLI uses two protocols: TCP (port 27019) for queries/CRUD, and HTTP (port 27018) for export/import.
            They are separate surfaces — TCP commands cannot talk to the HTTP API and vice versa.
            TCPAuth and TLS features require AxioDB server version 15.0.0 or later.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CliPage;
