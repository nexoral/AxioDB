import React, { useState } from "react";
import { Play, Zap } from "lucide-react";
import Seo from "../ui/Seo";
import type { StageMode } from "../execution/ExecutionTypes";
import ExecutionHome from "../execution/ExecutionHome";
import ExecutionStudio from "../execution/ExecutionStudio";

/**
 * /execution — watch AxioDB actually run, animated.
 *
 * The page owns the mode picker (local embedded vs AxioDBCloud), then renders
 * the studio for the chosen mode. All step-by-step state lives inside the
 * playback engine (`useExecutionTimeline`), which only advances client-side.
 */
const AnimatedExecution: React.FC = () => {
  const [mode, setMode] = useState<StageMode | null>(null);

  return (
    <section id="execution" className="pt-12 scroll-mt-20">
      <Seo
        title="Animated Execution - Watch AxioDB Run in Your Browser"
        description="Interactive animated walkthroughs of AxioDB internals: on-disk storage, dual-write indexes, cache TTL, ACID transactions, worker threads — plus the AxioDBCloud TCP client: connection pool, framing, TLS, heartbeat, reconnect and transaction pinning."
        path="/execution"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 sm:p-8 lg:p-12 mb-8 border shadow-lg animate-fade-in ${
          mode === "cloud"
            ? "bg-gradient-to-br from-cyan-950 via-ink-950 to-blue-950 border-cyan-900"
            : "bg-gradient-to-br from-violet-950 via-ink-950 to-accent-950 border-accent-900"
        }`}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl bg-accent-900/40 animate-blob-drift" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full blur-3xl bg-cyan-900/30" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-accent-600 rounded-xl shadow-lg animate-glow">
              <Play className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm bg-accent-100 text-accent-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              Interactive
            </span>
            <span className="text-sm bg-ink-100/10 text-gray-200 px-3 py-1 rounded-full font-bold border border-ink-700">
              22 scenarios
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
            Animated Execution
          </h1>
          <p className="text-base sm:text-lg text-gray-300 font-light max-w-3xl mb-4">
            Press play and watch AxioDB actually run — the file writes, the token
            travelling over TCP, the cache TTLs, the worker fan-out. Each animation
            is a real trace of the source code in{" "}
            <code className="text-accent-300 bg-accent-900/30 px-1.5 py-0.5 rounded text-sm font-semibold">
              source/
            </code>
            , with the actual implementation beside it.
          </p>

          {!mode && (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-400" />
              Pick a mode to start — local embedded engine or the remote
              AxioDBCloud TCP client.
            </p>
          )}
        </div>
      </div>

      {/* ── Mode picker / studio ─────────────────────────────── */}
      {mode === null ? (
        <ExecutionHome onSelect={setMode} />
      ) : (
        <ExecutionStudio mode={mode} onBack={() => setMode(null)} />
      )}
    </section>
  );
};

export default AnimatedExecution;