import { motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Boxes,
  CircleDot,
  Code2,
  Database,
  HardDrive,
  Layers,
  MemoryStick,
  Radio,
  ShieldCheck,
  Cog,
  type LucideIcon,
} from "lucide-react";
import {
  NODE_H,
  NODE_W,
  edgePath,
  type Frame,
  type Scenario,
  type StageKind,
  type StageNode,
} from "./ExecutionTypes";
import ExecutionToken from "./ExecutionToken";

export type { Frame };

interface ExecutionCanvasProps {
  scenario: Scenario;
  frame: Frame;
  /** Progress 0..1 of the token edge the parent wants shown; unused by tokens (they self-animate). */
  playing: boolean;
  speed: number;
  frameKey: string;
}

const KIND_ICON: Record<StageKind, LucideIcon> = {
  call: Code2,
  process: Cog,
  io: HardDrive,
  store: Archive,
  memory: MemoryStick,
  auth: ShieldCheck,
  network: Radio,
  pool: Layers,
  data: Database,
  worker: Boxes,
  decor: CircleDot,
};

const KIND_STYLE: Record<
  StageKind,
  { stroke: string; glow: string; label: string }
> = {
  call: { stroke: "#FB7185", glow: "#FB7185", label: "#FDA4AF" },
  process: { stroke: "#A78BFA", glow: "#A78BFA", label: "#C4B5FD" },
  io: { stroke: "#FBBF24", glow: "#FBBF24", label: "#FDE68A" },
  store: { stroke: "#38BDF8", glow: "#38BDF8", label: "#7DD3FC" },
  memory: { stroke: "#34D399", glow: "#34D399", label: "#6EE7B7" },
  auth: { stroke: "#FB923C", glow: "#FB923C", label: "#FDBA74" },
  network: { stroke: "#22D3EE", glow: "#22D3EE", label: "#67E8F9" },
  pool: { stroke: "#60A5FA", glow: "#60A5FA", label: "#93C5FD" },
  data: { stroke: "#2DD4BF", glow: "#2DD4BF", label: "#5EEAD4" },
  worker: { stroke: "#E879F9", glow: "#E879F9", label: "#F0ABFC" },
  decor: { stroke: "#94A3B8", glow: "#94A3B8", label: "#CBD5E1" },
};

const ACTIVE_STROKE = "#FF2E97";
const ACTIVE_LABEL = "#FFFFFF";
const ACTIVE_FILL = "#241221";

const EDGE_BASE = "#3E3A47";
const EDGE_ACTIVE = "#FF2E97";

/**
 * Draws one scenario as an interactive SVG stage. Nodes are rects positioned
 * in scenario coordinates; edges are curved paths referenced by the tokens via
 * a ref map. The current `frame` decides which nodes/edges light up and which
 * token travels. Purely presentational data flow — all playback state lives in
 * the `useExecutionTimeline` hook the studio uses.
 */
const ExecutionCanvas: React.FC<ExecutionCanvasProps> = ({
  scenario,
  frame,
  playing,
  speed,
  frameKey,
}) => {
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const [vw, vh] = scenario.viewBox;

  const activeNodes = useMemo(() => new Set(frame.nodes ?? []), [frame.nodes]);
  const activeEdges = useMemo(() => new Set(frame.edges ?? []), [frame.edges]);

  // Edge `<path>` elements are only registered via callback refs during the
  // commit phase — after render. Re-render once on mount so the first frame's
  // token has real paths to travel instead of a null ref map.
  const [, bumpRender] = useState(0);
  useEffect(() => {
    bumpRender((t) => t + 1);
  }, [scenario.id]);

  const tokenDuration = (frame.duration ?? 1600) / speed;

  const renderNode = (node: StageNode) => {
    const w = node.w ?? NODE_W;
    const h = node.h ?? NODE_H;
    const isActive = activeNodes.has(node.id);
    const style = KIND_STYLE[node.kind];
    const Icon = KIND_ICON[node.kind];
    const cx = node.x + w / 2;
    const cy = node.y + h / 2;

    return (
      <g key={node.id} pointerEvents="none">
        {isActive && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={Math.max(w, h) / 2 + 6}
            fill="none"
            stroke={ACTIVE_STROKE}
            strokeWidth={2}
            animate={{ r: [Math.max(w, h) / 2 + 6, Math.max(w, h) / 2 + 18], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <rect
          x={node.x}
          y={node.y}
          width={w}
          height={h}
          rx={12}
          fill={isActive ? ACTIVE_FILL : "#18161C"}
          stroke={isActive ? ACTIVE_STROKE : style.stroke}
          strokeWidth={isActive ? 2.5 : 1.5}
          strokeDasharray={node.kind === "decor" ? "4 4" : undefined}
        />
        <g transform={`translate(${node.x + 14}, ${node.y + h / 2 - 10})`}>
          <rect
            width={26}
            height={20}
            rx={6}
            fill={isActive ? "#431D33" : "rgba(255,255,255,0.05)"}
            stroke="none"
          />
          <Icon
            x={6}
            y={3}
            size={14}
            stroke={isActive ? ACTIVE_STROKE : style.glow}
          />
        </g>
        <text
          x={node.x + 52}
          y={node.y + 25}
          className="font-sans text-[13px] font-semibold"
          fill={isActive ? ACTIVE_LABEL : style.label}
        >
          {node.label}
        </text>
        {node.sub && (
          <text
            x={node.x + 52}
            y={node.y + 46}
            className="font-mono text-[10.5px]"
            fill={isActive ? "#F9A8D4" : "#7C7A85"}
          >
            {node.sub}
          </text>
        )}
      </g>
    );
  };

  const renderEdge = (edgeId: string) => {
    const isActive = activeEdges.has(edgeId);
    return (
      <motion.path
        key={edgeId}
        ref={(el) => {
          if (el) pathRefs.current.set(edgeId, el);
          else pathRefs.current.delete(edgeId);
        }}
        id={`exec-edge-${scenario.id}-${edgeId}`}
        d={edgePath(scenario, scenario.edges.find((e) => e.id === edgeId)!)}
        fill="none"
        stroke={isActive ? EDGE_ACTIVE : EDGE_BASE}
        strokeWidth={isActive ? 3 : 1.6}
        strokeDasharray={scenario.edges.find((e) => e.id === edgeId)?.dashed ? "7 5" : undefined}
        strokeLinecap="round"
        initial={false}
        animate={isActive ? { strokeOpacity: [0.55, 1, 0.55] } : { strokeOpacity: 1 }}
        transition={{ duration: 0.9, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      />
    );
  };

  const token = frame.token ?? null;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label={`${scenario.title} execution diagram`}
    >
      <defs>
        <marker
          id={`arrow-base-${scenario.id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_BASE} />
        </marker>
        <marker
          id={`arrow-active-${scenario.id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_ACTIVE} />
        </marker>
      </defs>

      {/* connection lines under the nodes */}
      <g>
        {scenario.edges.map((edge) => {
          const isActive = activeEdges.has(edge.id);
          const base = renderEdge(edge.id);
          return (
            <g key={edge.id}>
              {base}
              <path
                d={edgePath(scenario, edge)}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                markerEnd={
                  isActive
                    ? `url(#arrow-active-${scenario.id})`
                    : `url(#arrow-base-${scenario.id})`
                }
              />
            </g>
          );
        })}
      </g>

      {/* nodes on top of edges */}
      {scenario.nodes.map(renderNode)}

      {token && (
        <ExecutionToken
          key={`${frameKey}-${token.edgeId}`}
          pathRef={pathRefs.current.get(token.edgeId) ?? null}
          duration={tokenDuration}
          playing={playing}
          tone={token.tone}
          label={token.label}
        />
      )}
    </svg>
  );
};

export default ExecutionCanvas;