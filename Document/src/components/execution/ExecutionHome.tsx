import React from "react";
import {
  ArrowRight,
  Boxes,
  Cpu,
  Database,
  KeyRound,
  Layers,
  PlugZap,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { StageMode } from "./ExecutionTypes";

interface ExecutionHomeProps {
  onSelect: (mode: StageMode) => void;
}

interface ModeCard {
  mode: StageMode;
  icon: React.ReactNode;
  badge: string;
  gradient: string;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  chips: { icon: React.ReactNode; label: string }[];
  cta: string;
  scenarioCount: number;
}

const MODE_CARDS: ModeCard[] = [
  {
    mode: "local",
    icon: <Database className="h-7 w-7" />,
    badge: "Embedded engine",
    gradient: "from-violet-600 to-accent-600",
    iconBg: "bg-gradient-to-br from-violet-600 to-accent-600",
    title: "AxioDB Local",
    subtitle: "The embedded, in-process engine",
    description:
      "How the database actually works under your Node process: the file-per-document tree on disk, dual-write indexes, the InMemoryCache with random 5-15m TTL, single-operation ACID transactions, sessions and worker threads.",
    chips: [
      { icon: <Layers className="h-3.5 w-3.5" />, label: "On-disk storage" },
      { icon: <Zap className="h-3.5 w-3.5" />, label: "Indexes + cache" },
      { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "ACID writes" },
      { icon: <Cpu className="h-3.5 w-3.5" />, label: "Worker threads" },
    ],
    cta: "Watch the embedded engine",
    scenarioCount: 13,
  },
  {
    mode: "cloud",
    icon: <PlugZap className="h-7 w-7" />,
    badge: "Remote / TCP",
    gradient: "from-cyan-600 to-blue-600",
    iconBg: "bg-gradient-to-br from-cyan-600 to-blue-600",
    title: "AxioDBCloud",
    subtitle: "Remote database over TCP 27019",
    description:
      "How the client talks to a remote AxioDBCloud server: parsing axiodb:// connection strings, the maxPoolSize connection pool with least-busy routing, binary message framing, TLS, PING heartbeats, exponential-backoff reconnect and transaction connection-pinning.",
    chips: [
      { icon: <Boxes className="h-3.5 w-3.5" />, label: "Connection pool" },
      { icon: <KeyRound className="h-3.5 w-3.5" />, label: "RBAC auth" },
      { icon: <Database className="h-3.5 w-3.5" />, label: "TLS encryption" },
      { icon: <Zap className="h-3.5 w-3.5" />, label: "Heartbeat + retry" },
    ],
    cta: "Watch the remote client",
    scenarioCount: 9,
  },
];

/**
 * Mode picker for the Animated Execution page. Two large cards — AxioDB Local
 * (embedded) and AxioDBCloud (remote/TCP) — each opens its own scenario rail
 * in the studio. Rendered statically (CSS entrance only) so the prerendered
 * page is fully visible without JS.
 */
const ExecutionHome: React.FC<ExecutionHomeProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {MODE_CARDS.map((card, i) => (
        <button
          key={card.mode}
          type="button"
          onClick={() => onSelect(card.mode)}
          style={{ animationDelay: `${i * 120}ms` }}
          className="group relative text-left overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 p-6 sm:p-8 shadow-xl animate-fade-in hover-lift transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <div
            className={`absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-30 ${card.gradient}`}
          />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <span
                className={`inline-flex p-3 rounded-2xl text-white shadow-lg ${card.iconBg}`}
              >
                {card.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-ink-800 border border-ink-700 text-gray-400">
                {card.badge}
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white">{card.title}</h2>
            <p className="text-sm font-semibold text-accent-300 mb-3">{card.subtitle}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-5 min-h-[84px]">
              {card.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {card.chips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-800 border border-ink-700 text-[11px] font-medium text-gray-300"
                >
                  <span className="text-accent-400">{chip.icon}</span>
                  {chip.label}
                </span>
              ))}
            </div>

            <span
              className={`inline-flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r ${card.gradient} px-4 py-2.5 rounded-xl shadow-lg transition-transform group-hover:translate-x-1`}
            >
              {card.cta}
              <ArrowRight className="h-4 w-4" />
              <span className="ml-1 text-white/80 font-semibold text-[11px] normal-case">
                {card.scenarioCount} scenarios
              </span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ExecutionHome;