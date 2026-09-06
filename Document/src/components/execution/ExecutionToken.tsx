import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import React, { useRef } from "react";

const TOKEN_COLORS = {
  primary: { fill: "#D60066", text: "#FFE4EF" },
  success: { fill: "#10B981", text: "#D1FAE5" },
  warning: { fill: "#F59E0B", text: "#FEF3C7" },
  error: { fill: "#F43F5E", text: "#FFE4E6" },
  net: { fill: "#06B6D4", text: "#CFFAFE" },
  io: { fill: "#FACC15", text: "#FEFCE8" },
  store: { fill: "#38BDF8", text: "#E0F2FE" },
  mut: { fill: "#D60066", text: "#FFE4EF" },
} as const;

export interface ExecutionTokenProps {
  /** The ``<path>`` element the token travels along (from the canvas ref map). */
  pathRef: SVGPathElement | null;
  /** Frame animation budget in ms — the token covers the whole path in this time. */
  duration: number;
  playing: boolean;
  tone?: keyof typeof TOKEN_COLORS;
  label?: string;
}

/**
 * A particle that travels along an SVG path edge using `getPointAtLength`.
 * Driven by a framer-motion animation loop so movement stays on the compositor
 * and pauses cleanly when playback is paused. Remounted per frame (see the
 * `key` the canvas passes) so every new token starts at the path origin.
 */
const ExecutionToken: React.FC<ExecutionTokenProps> = ({
  pathRef,
  duration,
  playing,
  tone = "primary",
  label,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const elapsed = useRef(0);

  useAnimationFrame((_, delta) => {
    if (!playing || !pathRef) return;
    elapsed.current = Math.min(elapsed.current + delta, duration);
    const ratio = elapsed.current / duration;
    const length = pathRef.getTotalLength();
    const point = pathRef.getPointAtLength(length * ratio);
    x.set(point.x);
    y.set(point.y);
  });

  const palette = TOKEN_COLORS[tone];

  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={7}
        fill={palette.fill}
        stroke="#ffffff"
        strokeWidth={2}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx={x}
        cy={y}
        r={7}
        fill="none"
        stroke={palette.fill}
        strokeWidth={3}
        animate={{ r: [7, 20], opacity: [0.7, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
      />
      {label && (
        <motion.text
          x={x}
          y={y}
          dy={-16}
          textAnchor="middle"
          className="font-mono text-[11px] font-bold"
          fill={palette.text}
          style={{ paintOrder: "stroke", stroke: "#120E10", strokeWidth: 4 }}
        >
          {label}
        </motion.text>
      )}
    </g>
  );
};

export default ExecutionToken;