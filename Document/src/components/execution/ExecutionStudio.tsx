import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Braces,
  CircleDot,
  Cpu,
  Database,
  FilePlus2,
  Filter,
  FolderTree,
  HeartPulse,
  KeyRound,
  Layers,
  ListTree,
  Lock,
  Pencil,
  Pin,
  PlugZap,
  RotateCcw,
  Search,
  ShieldCheck,
  Unplug,
  Waypoints,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { LogLine, Scenario, StageKind, StageMode } from "./ExecutionTypes";
import ExecutionCanvas from "./ExecutionCanvas";
import ExecutionLog from "./ExecutionLog";
import ExecutionTimeline from "./ExecutionTimeline";
import CodeBlock from "../ui/CodeBlock";
import { useExecutionTimeline } from "../../hooks/useExecutionTimeline";
import { localScenarios } from "./executionScenariosLocal";
import { cloudScenarios } from "./executionScenariosCloud";

interface ExecutionStudioProps {
  mode: StageMode;
  onBack: () => void;
}

const SCENARIO_ICONS: Record<string, LucideIcon> = {
  "folder-tree": FolderTree,
  database: Database,
  layers: Layers,
  "file-plus": FilePlus2,
  "list-tree": ListTree,
  search: Search,
  zap: Zap,
  pencil: Pencil,
  "shield-check": ShieldCheck,
  "book-open": BookOpen,
  filter: Filter,
  cpu: Cpu,
  "plug-zap": PlugZap,
  "key-round": KeyRound,
  braces: Braces,
  waypoints: Waypoints,
  lock: Lock,
  "heart-pulse": HeartPulse,
  "rotate-ccw": RotateCcw,
  unplug: Unplug,
  pin: Pin,
};

const KIND_LEGEND: { kind: StageKind; color: string; label: string }[] = [
  { kind: "call", color: "#FB7185", label: "caller" },
  { kind: "process", color: "#A78BFA", label: "internal" },
  { kind: "io", color: "#FBBF24", label: "disk I/O" },
  { kind: "store", color: "#38BDF8", label: "store" },
  { kind: "memory", color: "#34D399", label: "memory" },
  { kind: "auth", color: "#FB923C", label: "auth/RBAC" },
  { kind: "network", color: "#22D3EE", label: "network" },
  { kind: "pool", color: "#60A5FA", label: "pool" },
  { kind: "data", color: "#2DD4BF", label: "data" },
  { kind: "worker", color: "#E879F9", label: "worker" },
  { kind: "decor", color: "#94A3B8", label: "annotation" },
];

const MODE_BADGE: Record<StageMode, { label: string; classes: string }> = {
  local: {
    label: "AxioDB Local · embedded",
    classes: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  cloud: {
    label: "AxioDBCloud · remote TCP",
    classes: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
};

/**
 * Accumulates every log line from frame 0 up to (and including) the current
 * playback cursor, so the console reads like a live transcript of the run.
 */
function useLogLines(scenario: Scenario, step: number, frame: number): LogLine[] {
  return useMemo(() => {
    const lines: LogLine[] = [];
    for (let s = 0; s <= step; s++) {
      const stepFrames = scenario.steps[s].frames;
      const frameCount = s === step ? frame + 1 : stepFrames.length;
      for (let f = 0; f < frameCount; f++) {
        lines.push(...(stepFrames[f].log ?? []));
      }
    }
    return lines;
  }, [scenario, step, frame]);
}

/**
 * Plays one scenario end-to-end. Remounted via `key={scenario.id}` so switching
 * scenarios in the rail always starts the timeline over from step 0.
 */
const ScenarioPlayer: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
  const timeline = useExecutionTimeline(scenario);
  const { currentFrame, currentStep, cursor, frameIndex, playing, speed } = timeline;
  const frameKey = `${scenario.id}-${frameIndex}`;
  const logLines = useLogLines(scenario, cursor.step, cursor.frame);

  const kindsPresent = useMemo(
    () => new Set(scenario.nodes.map((node) => node.kind)),
    [scenario],
  );

  return (
    <div className="min-w-0">
      {/* Scenario header */}
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">{scenario.title}</h2>
        <p className="text-sm font-semibold text-accent-300 mt-0.5">{scenario.short}</p>
        <p className="text-sm text-gray-400 leading-relaxed mt-2 max-w-3xl">
          {scenario.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {KIND_LEGEND.filter((entry) => kindsPresent.has(entry.kind)).map((entry) => (
            <span
              key={entry.kind}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div className="rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden mb-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-ink-800 border-b border-ink-700">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-600/15 border border-accent-500/30 text-accent-300 text-[11px] font-bold">
            <CircleDot className="h-3 w-3" />
            {currentStep.title}
          </span>
          <span className="font-mono text-[10px] text-gray-500 ml-auto">
            frame {frameIndex + 1}/{timeline.totalFrames} · step {cursor.step + 1}/
            {timeline.totalSteps}
          </span>
        </div>
        <div className="p-2 sm:p-4 bg-[radial-gradient(ellipse_at_top,#1d1622_0%,#120e10_65%)]">
          <ExecutionCanvas
            scenario={scenario}
            frame={currentFrame}
            playing={playing}
            speed={speed}
            frameKey={frameKey}
          />
        </div>
        {currentFrame.note && (
          <div className="px-4 py-2.5 border-t border-ink-700 flex items-center gap-2 bg-ink-900">
            <span className="text-accent-400 shrink-0">▸</span>
            <p className="text-xs text-gray-300 leading-relaxed">{currentFrame.note}</p>
          </div>
        )}
      </div>

      {/* Transport */}
      <div className="mb-4">
        <ExecutionTimeline timeline={timeline} />
      </div>

      {/* Console + real code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExecutionLog lines={logLines} />
        <div className="rounded-xl border border-ink-700 bg-ink-950 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-ink-800 border-b border-ink-700">
            <BookOpen size={14} className="text-accent-400" />
            <span className="text-xs font-semibold text-gray-300 tracking-wide">
              the real implementation
            </span>
            <span className="ml-auto font-mono text-[10px] text-gray-500">source/</span>
          </div>
          <CodeBlock code={scenario.code} language="typescript" />
        </div>
      </div>
    </div>
  );
};

/**
 * Scenario studio: a scrollable rail of the mode's scenarios on the left and
 * the animated player on the right. Choosing a rail item remounts the player
 * (key = scenario.id) so playback always starts from clean state.
 */
const ExecutionStudio: React.FC<ExecutionStudioProps> = ({ mode, onBack }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const scenarios = mode === "local" ? localScenarios : cloudScenarios;
  const active =
    scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0];
  const badge = MODE_BADGE[mode];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-ink-700 bg-ink-800 text-gray-300 text-sm font-semibold transition-all hover:text-white hover:border-accent-500"
        >
          <ArrowLeft className="h-4 w-4" />
          All scenarios
        </button>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${badge.classes}`}
        >
          {mode === "local" ? (
            <Database className="h-3.5 w-3.5" />
          ) : (
            <PlugZap className="h-3.5 w-3.5" />
          )}
          {badge.label}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Scenario rail */}
        <nav
          aria-label="Scenarios"
          className="lg:w-72 shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-hide"
        >
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {scenarios.map((scenario) => {
              const Icon = SCENARIO_ICONS[scenario.iconKey] ?? Database;
              const isActive = scenario.id === active.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveId(scenario.id)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all min-w-[230px] lg:min-w-0 shrink-0 ${
                    isActive
                      ? "bg-ink-800 border-accent-500 shadow-[0_0_16px_rgba(214,0,102,0.25)]"
                      : "bg-ink-900 border-ink-700 hover:border-ink-600 hover:bg-ink-800"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex p-1.5 rounded-lg ${
                      isActive
                        ? "bg-accent-600 text-white"
                        : "bg-ink-800 text-gray-400 border border-ink-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-[13px] font-bold leading-snug ${
                        isActive ? "text-white" : "text-gray-200"
                      }`}
                    >
                      {scenario.title}
                    </span>
                    <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">
                      {scenario.short}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active player */}
        <div className="flex-1 min-w-0">
          <ScenarioPlayer key={active.id} scenario={active} />
        </div>
      </div>
    </div>
  );
};

export default ExecutionStudio;