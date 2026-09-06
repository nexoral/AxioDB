import { motion } from "framer-motion";
import React, { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import type { LogLine } from "./ExecutionTypes";

const TONE_STYLE: Record<NonNullable<LogLine["tone"]>, string> = {
  info: "text-gray-300",
  ok: "text-emerald-300",
  mut: "text-accent-300",
  err: "text-rose-300",
  warn: "text-amber-300",
  net: "text-cyan-300",
  store: "text-violet-300",
  io: "text-yellow-300",
};

const TONE_DOT: Record<NonNullable<LogLine["tone"]>, string> = {
  info: "bg-gray-400",
  ok: "bg-emerald-400",
  mut: "bg-accent-400",
  err: "bg-rose-400",
  warn: "bg-amber-400",
  net: "bg-cyan-400",
  store: "bg-violet-400",
  io: "bg-yellow-400",
};

/**
 * Live console that appends log lines frame-by-frame. Newest lines slide in
 * and the viewport auto-scrolls to follow the playback. Capped render list is
 * not needed here because a scenario's whole run only produces a few dozen
 * lines.
 */
const ExecutionLog: React.FC<{ lines: LogLine[] }> = ({ lines }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-950 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-800 border-b border-ink-700">
        <Terminal size={14} className="text-accent-400" />
        <span className="text-xs font-semibold text-gray-300 tracking-wide">
          execution.log
        </span>
        <span className="ml-auto font-mono text-[10px] text-gray-500">
          {lines.length} lines
        </span>
      </div>
      <div
        ref={scrollRef}
        className="h-[190px] overflow-y-auto px-3 py-3 font-mono text-[11px] leading-relaxed scrollbar-hide"
        aria-live="polite"
      >
        {lines.length === 0 && (
          <span className="text-gray-500 italic">
            awaiting first operation…
          </span>
        )}
        {lines.map((line, i) => {
          const tone = line.tone ?? "info";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2 py-[1px]"
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${TONE_DOT[tone]}`} />
              <span className={`whitespace-pre-wrap break-all ${TONE_STYLE[tone]}`}>{line.text}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ExecutionLog;