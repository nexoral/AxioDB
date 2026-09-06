/**
 * Data model for the "Animated Execution" interactive diagrams.
 *
 * A `Scenario` is a directed graph of `StageNode`s and `StageEdge`s. The
 * playback engine walks `Scenario.steps`, each step a list of `Frame`s. A
 * frame paints the state of the stage at one moment in time: which nodes are
 * highlighted, which edges flash, whether a "token" particle is travelling
 * along an edge, and what log lines are appended to the console.
 *
 * Coordinates are in raw SVG units (see `Scenario.viewBox`). Keep node
 * bounding boxes non-overlapping and edges reasonably short for readable
 * diagrams on the ~900px stage.
 */

export type StageMode = "local" | "cloud";

export type StageKind =
  | "call"        // entry point / caller code
  | "process"     // internal step (Collection, Transaction, ...)
  | "io"          // disk / filesystem activity
  | "store"       // persistent store (files, WAL, registry)
  | "memory"      // in-memory structure (Map, heap)
  | "auth"        // authentication / RBAC
  | "network"     // TCP socket / remote
  | "pool"        // connection pool lane
  | "data"        // data container (folder, file, document)
  | "worker"      // worker thread
  | "decor";      // annotation / branch marker

export interface StageNode {
  id: string;
  label: string;
  sub?: string;
  /** Top-left corner in SVG units. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  kind: StageKind;
}

export interface StageEdge {
  id: string;
  from: string;
  to: string;
  dashed?: boolean;
  label?: string;
}

export interface LogLine {
  text: string;
  /** info = muted, ok = emerald, mut = accent, err = red, warn = amber, net = cyan, store = violet, io = disk-yellow */
  tone?: "info" | "ok" | "mut" | "err" | "warn" | "net" | "store" | "io";
}

export interface TokenSpec {
  edgeId: string;
  /**
   * Particle color. Mirrors the log console palette so a token that represents
   * a file write ("store"/"io") or an in-memory mutation ("mut") reads the same
   * color in both places.
   */
  tone?: "primary" | "success" | "warning" | "error" | "net" | "io" | "store" | "mut";
  /** Small caption above the token, e.g. the payload name. */
  label?: string;
}

export interface Frame {
  /** Node ids that light up during this frame. */
  nodes?: string[];
  /** Edge ids that flash during this frame. */
  edges?: string[];
  /**
   * A token particle travelling along this edge (from -> to). The token runs
   * over the whole `duration` of the frame. Omit (or null) for no token.
   */
  token?: TokenSpec | null;
  /** Human-readable annotation shown under the stage for this frame. */
  note?: string;
  /** Log lines appended to the console when this frame starts. */
  log: LogLine[];
  /** Animation length in milliseconds. Defaults to 1600ms when omitted. */
  duration?: number;
}

export interface Step {
  title: string;
  frames: Frame[];
}

export interface Scenario {
  id: string;
  title: string;
  short: string;
  mode: StageMode;
  /** Lucide icon key for the scenario rail, resolved in ExecutionStudio. */
  iconKey: string;
  /** Brief factual description shown above the stage. */
  description: string;
  /** Real, minimal code snippet for this scenario. */
  code: string;
  viewBox: [number, number];
  nodes: StageNode[];
  edges: StageEdge[];
  steps: Step[];
  legend?: { color: string; label: string }[];
}

/* ── Shared svg helpers ─────────────────────────────────────────────── */

export const NODE_W = 184;
export const NODE_H = 66;

export function nodeCenter(node: Pick<StageNode, "x" | "y" | "w" | "h">): {
  cx: number;
  cy: number;
} {
  return {
    cx: node.x + (node.w ?? NODE_W) / 2,
    cy: node.y + (node.h ?? NODE_H) / 2,
  };
}

export function edgePath(scenario: Scenario, edge: StageEdge): string {
  const from = scenario.nodes.find((n) => n.id === edge.from);
  const to = scenario.nodes.find((n) => n.id === edge.to);
  if (!from || !to) return "";
  const a = nodeCenter(from);
  const b = nodeCenter(to);
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  // Slight vertical bow so parallel flows don't overlap perfectly.
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const ox = -dy * 0.18;
  const oy = dx * 0.18;
  return `M ${a.cx} ${a.cy} Q ${mx + ox} ${my + oy} ${b.cx} ${b.cy}`;
}