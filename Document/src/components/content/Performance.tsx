import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Monitor,
  Shield,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";

interface BenchmarkRow {
  size: number;
  indexed: number;
  documentId: number;
  gtRange: number;
  gteLteRange: number;
  inOp5: number;
  inOp50: number;
  limit5: number;
  regex: number;
  sort: number;
  fullScan: number;
  indexedQuery: number;
  cacheFirst: number;
  cacheHit: number;
}

const benchmarkData: BenchmarkRow[] = [
  { size: 1000, indexed: 1, documentId: 0, gtRange: 61, gteLteRange: 50, inOp5: 41, inOp50: 76, limit5: 73, regex: 79, sort: 57, fullScan: 72, indexedQuery: 2, cacheFirst: 59, cacheHit: 0 },
  { size: 5000, indexed: 2, documentId: 0, gtRange: 97, gteLteRange: 89, inOp5: 55, inOp50: 235, limit5: 173, regex: 229, sort: 105, fullScan: 241, indexedQuery: 2, cacheFirst: 110, cacheHit: 0 },
  { size: 10000, indexed: 1, documentId: 1, gtRange: 174, gteLteRange: 111, inOp5: 85, inOp50: 455, limit5: 267, regex: 466, sort: 171, fullScan: 333, indexedQuery: 1, cacheFirst: 112, cacheHit: 0 },
  { size: 50000, indexed: 2, documentId: 1, gtRange: 657, gteLteRange: 631, inOp5: 251, inOp50: 1278, limit5: 1111, regex: 1150, sort: 760, fullScan: 1050, indexedQuery: 1, cacheFirst: 338, cacheHit: 0 },
  { size: 100000, indexed: 1, documentId: 1, gtRange: 1123, gteLteRange: 807, inOp5: 533, inOp50: 2047, limit5: 1709, regex: 1959, sort: 1217, fullScan: 1781, indexedQuery: 1, cacheFirst: 703, cacheHit: 0 },
];

const machine = {
  cpu: "AMD Ryzen 5 5500U",
  cores: "6C / 12T @ 2.1 GHz",
  ram: "7.1 GB DDR4",
  os: "Ubuntu Linux 6.8.0",
  node: "v26.8.1",
  date: "September 5, 2026",
};

const suiteTimings = [
  { name: "CRUD Operations", time: 3737, tests: 30, color: "emerald" },
  { name: "Transactions", time: 625, tests: 22, color: "blue" },
  { name: "Read / Query", time: 146794, tests: 40, color: "violet" },
  { name: "Aggregation", time: 458, tests: 50, color: "cyan" },
  { name: "Auth & RBAC", time: 5954, tests: 32, color: "amber" },
  { name: "HTTP API", time: 1461, tests: 38, color: "orange" },
  { name: "TCP Auth", time: 2725, tests: 20, color: "rose" },
  { name: "TCP No-Auth", time: 627, tests: 6, color: "pink" },
  { name: "TCP Transactions", time: 1393, tests: 17, color: "indigo" },
  { name: "TCP TLS", time: 641, tests: 3, color: "slate" },
  { name: "Crash Recovery", time: 5731, tests: 3, color: "red" },
  { name: "MCP Confirm", time: 40, tests: 11, color: "teal" },
  { name: "MCP Functional", time: 1726, tests: 6, color: "fuchsia" },
];

const crudOps = [
  { label: "Insert Single", time: 31, note: "1 document" },
  { label: "InsertMany (500 docs)", time: 365, note: "batch insert" },
  { label: "Find by Index", time: 3, note: "exact match" },
  { label: "Find by documentId", time: 0, note: "direct lookup" },
  { label: "Find $gt", time: 55, note: "range scan" },
  { label: "Find $in", time: 2, note: "set lookup" },
  { label: "Find $ne / $nin", time: 56, note: "negation" },
  { label: "Find Limit/Skip/Sort", time: 70, note: "pagination" },
  { label: "findOne", time: 0, note: "first match" },
  { label: "Update Single", time: 35, note: "1 document" },
  { label: "Update Multiple", time: 326, note: "batch update" },
  { label: "Delete Single", time: 28, note: "1 document" },
  { label: "Delete Multiple", time: 144, note: "batch delete" },
];

const transactionOps = [
  { label: "Insert + Commit", time: 38 },
  { label: "Update + Commit", time: 32 },
  { label: "Delete + Commit", time: 44 },
  { label: "Mixed Operations", time: 46 },
  { label: "Rollback", time: 8 },
  { label: "Savepoint Create + Rollback", time: 24 },
  { label: "withTransaction (auto-commit)", time: 21 },
  { label: "Index sync after commit", time: 20 },
];

const httpOps = [
  { label: "POST /auth/login", time: 92 },
  { label: "PATCH /auth/change-password", time: 127 },
  { label: "GET /db/databases", time: 35 },
  { label: "POST /db/create-database", time: 2 },
  { label: "POST /operation/create/", time: 35 },
  { label: "GET /operation/all/by-id/", time: 3 },
  { label: "POST /operation/all/by-query/", time: 12 },
  { label: "PUT /operation/update/by-id/", time: 26 },
  { label: "DELETE /operation/delete/by-id/", time: 29 },
  { label: "POST /operation/create-many/", time: 31 },
  { label: "POST /operation/aggregate/", time: 4 },
  { label: "GET /dashboard-stats", time: 34 },
];

const tcpOps = [
  { label: "Auth + CRUD", time: 40, note: "authenticated" },
  { label: "Connection Pool (10)", time: 184, note: "pool init" },
  { label: "Custom Pool Size", time: 84, note: "pool init" },
  { label: "TLS CRUD", time: 93, note: "encrypted" },
  { label: "Rate Limit Lockout", time: 101, note: "per-IP" },
  { label: "Disconnect Auto-Rollback", time: 509, note: "safety" },
  { label: "Index Hint via TCP", time: 82, note: "query hint" },
];

const crashOps = [
  { label: "SIGKILL during inserts", time: 1722, note: "recovers cleanly" },
  { label: "SIGKILL during updates", time: 1936, note: "valid before/after" },
  { label: "SIGKILL during indexed inserts", time: 2030, note: "index consistent" },
];

const mcpOps = [
  { label: "DB / Collection / Document", time: 214 },
  { label: "Transaction handlers", time: 7 },
  { label: "User / Role / Dashboard", time: 889 },
];

const queryOps = [
  { key: "indexed", label: "Indexed", desc: "Exact match on indexed field" },
  { key: "documentId", label: "Doc ID", desc: "Direct documentId lookup" },
  { key: "gtRange", label: "$gt", desc: "Greater-than range scan" },
  { key: "gteLteRange", label: "$gte/$lte", desc: "Combined range boundary" },
  { key: "inOp5", label: "$in (5)", desc: "In-operator, 5 values" },
  { key: "inOp50", label: "$in (50)", desc: "In-operator, 50 values" },
  { key: "limit5", label: "Limit 5", desc: "Small limit query" },
  { key: "regex", label: "Regex", desc: "Pattern matching" },
  { key: "sort", label: "Sort", desc: "Sorted range query" },
  { key: "fullScan", label: "Full Scan", desc: "Collection scan (10K cap)" },
] as const;

const fmt = (n: number) => (n === 0 ? "<1 ms" : `${n.toLocaleString()} ms`);
const fmtSize = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `${n}`;
const fmtTime = (ms: number) => {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)} s`;
};

const perfBadge = (ms: number): string => {
  if (ms <= 2) return "text-emerald-700 bg-emerald-50 border-emerald-300";
  if (ms <= 100) return "text-emerald-800 bg-emerald-50/60 border-emerald-200";
  if (ms <= 300) return "text-amber-700 bg-amber-50 border-amber-200";
  if (ms <= 1000) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
};

const perfDot = (ms: number): string => {
  if (ms <= 2) return "bg-emerald-500";
  if (ms <= 100) return "bg-emerald-400";
  if (ms <= 300) return "bg-amber-400";
  if (ms <= 1000) return "bg-orange-400";
  return "bg-rose-400";
};

const OpTable: React.FC<{ title: string; icon: React.ReactNode; ops: { label: string; time: number; note?: string }[] }> = ({ title, icon, ops }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
      {icon}
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
    </div>
    <div className="divide-y divide-gray-100">
      {ops.map((op) => (
        <div key={op.label} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/60 transition-colors">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${perfDot(op.time)}`}></span>
            <span className="text-sm text-gray-700">{op.label}</span>
            {op.note && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{op.note}</span>}
          </div>
          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${perfBadge(op.time)}`}>
            {fmt(op.time)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ScaleBar: React.FC<{
  rows: BenchmarkRow[];
  opKey: keyof BenchmarkRow;
  label: string;
  desc: string;
}> = ({ rows, opKey, label, desc }) => {
  const maxVal = Math.max(...rows.map((r) => r[opKey] as number));

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-sm font-bold text-gray-800">{label}</span>
          <span className="text-xs text-gray-400 ml-2">{desc}</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const val = row[opKey] as number;
          const pct = maxVal > 0 ? Math.max((val / maxVal) * 100, val > 0 ? 3 : 0) : 0;
          return (
            <div key={row.size} className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400 w-12 text-right font-mono font-semibold shrink-0">
                {fmtSize(row.size)}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${perfDot(val)} opacity-80 group-hover:opacity-100`}
                  style={{ width: `${pct}%` }}
                />
                <span className={`absolute right-2 top-0.5 text-[10px] font-bold font-mono ${val <= 2 ? "text-emerald-700" : "text-gray-600"}`}>
                  {fmt(val)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Performance: React.FC = () => {
  const totalTests = suiteTimings.reduce((s, t) => s + t.tests, 0);

  return (
    <section id="performance" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB Performance Benchmarks - Real Query Timings Across Dataset Sizes"
        description="Measured performance benchmarks for AxioDB query operations across 1K to 100K document datasets. All tests run with npm test full suite (13/13 passing)."
        path="/performance"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-50 via-white to-emerald-50 rounded-2xl p-5 sm:p-8 lg:p-12 mb-12 border border-accent-200 shadow-lg animate-fade-in">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl animate-blob-drift"></div>
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-200/30 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-accent-600 rounded-xl shadow-lg animate-glow">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm bg-accent-100 text-accent-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              Benchmarked
            </span>
            <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
              13/13 Passing
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
            Performance Benchmarks
          </h1>
          <p className="text-lg text-gray-600 font-light max-w-3xl mb-8">
            Full test suite results at <strong className="text-gray-800">100,000 documents</strong> — CRUD, queries,
            transactions, HTTP API, TCP, crash recovery, and MCP. Every number from{" "}
            <code className="text-accent-700 bg-accent-100/60 px-1.5 py-0.5 rounded text-sm font-semibold">npm test</code>.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Cpu className="h-3.5 w-3.5" />, value: machine.cpu },
              { icon: <Monitor className="h-3.5 w-3.5" />, value: machine.cores },
              { icon: <HardDrive className="h-3.5 w-3.5" />, value: machine.ram },
              { icon: <Database className="h-3.5 w-3.5" />, value: machine.os },
              { icon: <Zap className="h-3.5 w-3.5" />, value: `Node ${machine.node}` },
              { icon: <Clock className="h-3.5 w-3.5" />, value: machine.date },
            ].map((chip) => (
              <span
                key={chip.value}
                className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm"
              >
                <span className="text-accent-500">{chip.icon}</span>
                {chip.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Highlights ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {[
          { icon: <Zap className="h-5 w-5" />, label: "Indexed Query", value: "1-2 ms", sub: "Constant across all sizes", ring: "ring-emerald-200 bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-500" },
          { icon: <Activity className="h-5 w-5" />, label: "Doc ID Lookup", value: "<1 ms", sub: "Direct file-per-doc read", ring: "ring-emerald-200 bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-500" },
          { icon: <Gauge className="h-5 w-5" />, label: "Cache Hit", value: "<1 ms", sub: "In-memory cached result", ring: "ring-blue-200 bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-500" },
          { icon: <CheckCircle2 className="h-5 w-5" />, label: "Test Coverage", value: `${totalTests} tests`, sub: "13 suites, all passing", ring: "ring-violet-200 bg-violet-50", text: "text-violet-700", iconBg: "bg-violet-500" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl p-5 border-2 ${c.ring} shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`p-1.5 ${c.iconBg} rounded-lg text-white shadow-sm`}>{c.icon}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{c.label}</span>
            </div>
            <p className={`text-3xl font-black ${c.text} font-mono`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Suite Overview ───────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-5 w-5 text-accent-600" />
          <h2 className="text-xl font-bold text-gray-900">Test Suite Overview</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          All 13 test suites at 100K documents. Each suite runs in an isolated child process.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suiteTimings.map((s) => (
            <div key={s.name} className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 text-${s.color}-500`} />
                <div>
                  <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{s.tests} tests</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">
                {fmtTime(s.time)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Query Scaling Table ──────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-1">
          <Database className="h-5 w-5 text-accent-600" />
          <h2 className="text-xl font-bold text-gray-900">Query Scaling (1K - 100K)</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          How read operations scale across dataset sizes. All timings in milliseconds.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-tl-2xl">Dataset</th>
                {queryOps.map((op, i) => (
                  <th key={op.key} className={`px-3 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap ${i === queryOps.length - 1 ? "rounded-tr-2xl" : ""}`} title={op.desc}>
                    {op.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((row, idx) => (
                <tr key={row.size} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/80"} hover:bg-accent-50/40 transition-colors`}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                      {fmtSize(row.size)} docs
                    </span>
                  </td>
                  {queryOps.map((op) => {
                    const val = row[op.key] as number;
                    return (
                      <td key={op.key} className="px-3 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold font-mono border ${perfBadge(val)}`}>
                          {fmt(val)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-gray-500">
          <span className="font-semibold mr-1">Speed:</span>
          {[
            { cls: "bg-emerald-50 border-emerald-300", label: "Lightning (≤2 ms)" },
            { cls: "bg-emerald-50/60 border-emerald-200", label: "Fast (≤100 ms)" },
            { cls: "bg-amber-50 border-amber-200", label: "Moderate (≤300 ms)" },
            { cls: "bg-orange-50 border-orange-200", label: "Slow (≤1 s)" },
            { cls: "bg-rose-50 border-rose-200", label: "Heavy (>1 s)" },
          ].map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1">
              <span className={`w-3 h-3 rounded border ${l.cls}`}></span>
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Scaling Charts ───────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-accent-600" />
          <h2 className="text-xl font-bold text-gray-900">Scaling Behavior</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">How each query operation scales from 1K to 100K documents.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {queryOps.map((op) => (
            <ScaleBar key={op.key} rows={benchmarkData} opKey={op.key} label={op.label} desc={op.desc} />
          ))}
        </div>
      </div>

      {/* ── CRUD / Transaction / HTTP / TCP / Crash / MCP ────── */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="h-5 w-5 text-accent-600" />
          <h2 className="text-xl font-bold text-gray-900">Operation Breakdown</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Individual operation timings from every test suite at 100K documents.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <OpTable title="CRUD Operations" icon={<Database className="h-4 w-4 text-emerald-600" />} ops={crudOps} />
          <OpTable title="Transactions (ACID)" icon={<Shield className="h-4 w-4 text-blue-600" />} ops={transactionOps} />
          <OpTable title="HTTP API Endpoints" icon={<Activity className="h-4 w-4 text-orange-600" />} ops={httpOps} />
          <OpTable title="TCP / AxioDBCloud" icon={<Terminal className="h-4 w-4 text-rose-600" />} ops={tcpOps} />
          <OpTable title="Crash Recovery" icon={<Zap className="h-4 w-4 text-red-600" />} ops={crashOps} />
          <OpTable title="MCP Server (AI)" icon={<Cpu className="h-4 w-4 text-fuchsia-600" />} ops={mcpOps} />
        </div>
      </div>

      {/* ── Insights ─────────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-accent-600" />
          <h2 className="text-xl font-bold text-gray-900">Key Takeaways</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <Zap className="h-5 w-5" />,
              color: "emerald",
              title: "Indexed = O(1) constant time",
              body: "Indexed and documentId lookups stay at 1-2 ms whether the collection has 1K or 100K docs. Each lookup reads exactly one file from disk.",
            },
            {
              icon: <Shield className="h-5 w-5" />,
              color: "blue",
              title: "ACID transactions stay fast",
              body: "Single-operation transactions (insert/update/delete + commit) complete in 32-44 ms. Rollback is just 8 ms.",
            },
            {
              icon: <Activity className="h-5 w-5" />,
              color: "orange",
              title: "HTTP API is lightweight",
              body: "CRUD via HTTP endpoints adds minimal overhead — insert is 35 ms, read by ID is 3 ms, query is 12 ms.",
            },
            {
              icon: <Gauge className="h-5 w-5" />,
              color: "blue",
              title: "Cache eliminates repeat reads",
              body: "First query hits disk; subsequent identical queries return from InMemoryCache in under 1 ms. Random TTL between 5-15 minutes.",
            },
            {
              icon: <Terminal className="h-5 w-5" />,
              color: "rose",
              title: "TCP with connection pooling",
              body: "10-connection pool initializes in 184 ms. TLS CRUD adds encryption overhead but stays under 100 ms per operation.",
            },
            {
              icon: <Zap className="h-5 w-5" />,
              color: "red",
              title: "Crash-safe recovery",
              body: "SIGKILL during rapid writes recovers cleanly — no corrupted documents. Recovery scans WAL + registry in ~2 seconds.",
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              color: "orange",
              title: "Full scan scales linearly",
              body: `From 72 ms at 1K to ${benchmarkData[4].fullScan.toLocaleString()} ms at 100K — linear scaling expected for file-per-document scans.`,
            },
            {
              icon: <BarChart3 className="h-5 w-5" />,
              color: "violet",
              title: "$in uses Set O(1) lookup",
              body: `Set-optimized $in at 100K: ${benchmarkData[4].inOp50.toLocaleString()} ms for 50 values. The value array is converted to a Set for constant-time checks.`,
            },
            {
              icon: <Cpu className="h-5 w-5" />,
              color: "fuchsia",
              title: "MCP for AI agents",
              body: "Full MCP server handles DB/collection/document/transaction/user/role operations. Functional tests complete in 1.7 seconds.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`bg-white rounded-xl p-5 border border-${card.color}-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group`}
            >
              <div className={`inline-flex p-2 rounded-lg bg-${card.color}-50 text-${card.color}-600 mb-3 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Methodology ──────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent-600" />
          Methodology
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
          {[
            "Each dataset size runs the full npm test suite — 13 test suites in isolated child processes",
            "Timings captured from real test output logs — end-to-end execution including index lookup, file I/O, and filtering",
            "Data generated with fixtures.generateUsers(N) — names, emails, ages (20-69 cycling), consistent across all sizes",
            "Indexes created on name, email, and age fields before dataset insertion",
            "File-per-document storage with JSONL registries, dual-write indexes, and random TTL cache (5-15 min)",
            "No warm-up runs discarded — first-run timings included, reflecting real cold-start behavior",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Performance;
