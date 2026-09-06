import React from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, StepBack, StepForward } from "lucide-react";
import type { useExecutionTimeline } from "../../hooks/useExecutionTimeline";

type Timeline = ReturnType<typeof useExecutionTimeline>;

interface ExecutionTimelineProps {
  timeline: Timeline;
}

const SPEEDS = [0.5, 1, 1.5, 2, 3];

/**
 * Transport bar + step navigator for the execution studio. Exposes the full
 * scenario as clickable step chips, play/pause/step/restart transport, a
 * speed selector, and a frame-progress meter.
 */
const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ timeline }) => {
  const {
    scenario,
    cursor,
    totalSteps,
    totalFrames,
    frameIndex,
    playing,
    speed,
    togglePlay,
    nextFrame,
    prevFrame,
    restart,
    gotoStep,
    changeSpeed,
  } = timeline;

  const progressPct = totalFrames === 0 ? 0 : ((frameIndex + 1) / totalFrames) * 100;

  const controlButton =
    "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-ink-700 bg-ink-800 text-gray-200 hover:text-white hover:border-accent-500 disabled:opacity-35 disabled:pointer-events-none transition-all";

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
      {/* Step chips */}
      <div className="px-3 pt-3 pb-2 border-b border-ink-700/70">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {scenario.steps.map((step, i) => {
            const isCurrent = cursor.step === i;
            return (
              <button
                key={step.title}
                onClick={() => gotoStep(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${
                  isCurrent
                    ? "bg-accent-600 border-accent-500 text-white shadow-[0_0_14px_rgba(214,0,102,0.45)]"
                    : "bg-ink-800 border-ink-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                {i + 1}. {step.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button onClick={restart} className={controlButton} aria-label="Restart" title="Restart">
            <RotateCcw size={15} />
          </button>
          <button onClick={prevFrame} disabled={frameIndex === 0} className={controlButton} aria-label="Previous frame" title="Previous frame">
            <StepBack size={15} />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-white transition-all shadow-lg ${
              playing
                ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/30"
                : "bg-accent-600 hover:bg-accent-500 shadow-accent-600/40"
            }`}
            aria-label={playing ? "Pause" : "Play"}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </motion.button>
          <button onClick={nextFrame} disabled={frameIndex >= totalFrames - 1} className={controlButton} aria-label="Next frame" title="Next frame">
            <StepForward size={15} />
          </button>
          <button
            onClick={() => gotoStep(cursor.step)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-ink-700 bg-ink-800 text-gray-200 hover:text-white hover:border-accent-500 transition-all"
            aria-label="Restart current step"
            title="Restart current step"
          >
            <SkipBack size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all border ${
                speed === s
                  ? "bg-ink-700 border-accent-500 text-white"
                  : "bg-ink-800 border-ink-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[160px] flex items-center gap-2 ml-auto">
          <span className="font-mono text-[10px] text-gray-400 whitespace-nowrap">
            step {cursor.step + 1}/{totalSteps}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span className="font-mono text-[10px] text-gray-400 whitespace-nowrap">
            {frameIndex + 1}/{totalFrames}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionTimeline;