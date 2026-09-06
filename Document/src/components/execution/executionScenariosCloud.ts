import type { Scenario, StageEdge, StageNode } from "./ExecutionTypes";

/**
 * AxioDBCloud (remote / TCP) scenarios for the Animated Execution page.
 *
 * Every layout and step ordering mirrors the real implementation in
 * `source/client/`: the `axiodb://host:port` connection string, the
 * `maxPoolSize` connection pool with least-busy routing, the binary
 * `[4-byte length][JSON]` framing on TCP 27019, TLS via `tls.connect`,
 * the 30s PING heartbeat, exponential-backoff reconnect, graceful
 * disconnect, and connection pinning for transactions.
 */

const n = (id: string, label: string, x: number, y: number, kind: StageNode["kind"], sub?: string, w?: number, h?: number): StageNode => ({ id, label, x, y, kind, sub, w, h });

const e = (id: string, from: string, to: string, dashed?: boolean): StageEdge => ({ id, from, to, dashed });

/* ── 1. Connect to AxioDBCloud ─────────────────────────────────────── */

const cloudConnect: Scenario = {
  id: "cloud-connect",
  title: "Connect to AxioDBCloud",
  short: "pool of TCP members",
  mode: "cloud",
  iconKey: "plug-zap",
  description:
    "`new AxioDBCloud('axiodb://host:27019')` opens a pool of `maxPoolSize` concurrent TCP connections (default 10). The first member must connect or `connect()` rejects; the rest come up via `allSettled`, so a per-IP connection cap degrades the pool instead of failing it.",
  code: `// source/client/AxioDBCloud.client.ts
const client = new AxioDBCloud('axiodb://localhost:27019', {
  maxPoolSize: 10,
  reconnectAttempts: 10,
});

await client.connect();
// first member gates: reachable host + valid credentials
// remaining members via Promise.allSettled → poolDegraded event`,
  viewBox: [1000, 460],
  nodes: [
    n("app", "Client app", 40, 30, "call", "new AxioDBCloud()", 190),
    n("conn", "axiodb://host:27019", 300, 30, "call", "parseConnectionString()", 210),
    n("pool", "Connection pool", 560, 30, "pool", "maxPoolSize = 10", 200),
    n("c1", "Member #1", 60, 170, "network", "CONNECTING → CONNECTED", 200),
    n("c2", "Member #2", 300, 170, "network", "CONNECTING", 200),
    n("cn", "Member #N", 540, 170, "network", "CONNECTING", 200),
    n("degraded", "poolDegraded event", 790, 170, "decor", "requested vs connected", 200),
    n("server", "AxioDBCloud server", 400, 330, "store", "TCP 27019", 200),
  ],
  edges: [
    e("app-conn", "app", "conn"),
    e("conn-pool", "conn", "pool"),
    e("pool-c1", "pool", "c1"),
    e("pool-c2", "pool", "c2"),
    e("pool-cn", "pool", "cn"),
    e("c1-server", "c1", "server"),
    e("c2-server", "c2", "server"),
    e("cn-server", "cn", "server"),
    e("degraded-pool", "degraded", "pool", true),
  ],
  steps: [
    {
      title: "Parse connection string",
      frames: [
        {
          nodes: ["app", "conn"],
          edges: ["app-conn"],
          token: { edgeId: "app-conn", tone: "primary", label: "axiodb://" },
          log: [
            { text: "new AxioDBCloud('axiodb://host:27019', { maxPoolSize: 10 })", tone: "mut" },
            { text: "conn string matched by /^axiodb:\\/\\/([^:]+):(\\d+)$/", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Materialise the pool",
      frames: [
        {
          nodes: ["pool", "c1", "c2", "cn"],
          edges: ["conn-pool", "pool-c1", "pool-c2", "pool-cn"],
          token: { edgeId: "conn-pool", tone: "net", label: "pool" },
          log: [
            { text: "pool = Array.from({ length: maxPoolSize }) → PooledConnection[]", tone: "mut" },
            { text: "each member owns its own socket, frame buffer, and reconnect loop" },
          ],
        },
      ],
    },
    {
      title: "First member gates",
      frames: [
        {
          nodes: ["c1", "server"],
          edges: ["c1-server"],
          token: { edgeId: "c1-server", tone: "success", label: "TCP" },
          log: [
            { text: "await pool[0].connect() — must succeed or connect() rejects", tone: "ok" },
            { text: "the first member is the reachability + credential signal" },
          ],
        },
      ],
    },
    {
      title: "Rest of the pool via allSettled",
      frames: [
        {
          nodes: ["c2", "cn"],
          edges: ["c2-server", "cn-server"],
          token: { edgeId: "c2-server", tone: "net", label: "connect" },
          log: [
            { text: "Promise.allSettled(members 2..N) — a failing member can't fail the pool", tone: "mut" },
            { text: "per-IP connection cap → smaller pool still comes up" },
          ],
        },
      ],
    },
    {
      title: "Degraded pool or ready",
      frames: [
        {
          nodes: ["degraded", "pool"],
          token: { edgeId: "degraded-pool", tone: "warning", label: "poolDegraded" },
          log: [
            { text: "if any member failed → emit('poolDegraded', { connected, failed })", tone: "warn" },
            { text: "otherwise emit('connected') — the app is ready" },
          ],
        },
      ],
    },
  ],
};

/* ── 2. Authenticate / RBAC ────────────────────────────────────────── */

const cloudAuth: Scenario = {
  id: "cloud-auth",
  title: "Authenticate (RBAC)",
  short: "login across the pool",
  mode: "cloud",
  iconKey: "key-round",
  description:
    "`client.login(username, password)` authenticates every connected pool member with the AUTHENTICATE command; the server checks credentials and role via RBAC, returns an `AuthenticatedUser`, and the credentials are stashed so a later automatic reconnect replays login on any member that drops.",
  code: `const user = await client.login('admin', 's3cret');
// → { username, role: 'admin' | 'user', mustChangePassword }

// AUTHENTICATE is sent on EVERY connected pool member so no
// member is silently unauthenticated. Credentials are stashed and
// replayed automatically after any reconnect.`,
  viewBox: [1000, 430],
  nodes: [
    n("app", "client.login()", 40, 30, "call", "username · password", 190),
    n("pool", "Connected members", 300, 30, "pool", "filter CONNECTED", 210),
    n("auth", "AUTHENTICATE cmd", 300, 160, "network", "sendCommand()", 210),
    n("rbac", "Server RBAC", 560, 160, "auth", "validate creds + role", 200),
    n("user", "AuthenticatedUser", 560, 300, "data", "role · mustChangePassword", 210),
    n("stash", "Credentials stashed", 300, 300, "memory", "replayed on reconnect", 210),
  ],
  edges: [
    e("app-pool", "app", "pool"),
    e("pool-auth", "pool", "auth"),
    e("auth-rbac", "auth", "rbac"),
    e("rbac-user", "rbac", "user"),
    e("auth-stash", "auth", "stash"),
    e("user-stash", "user", "stash", true),
  ],
  steps: [
    {
      title: "login() filters the pool",
      frames: [
        {
          nodes: ["app", "pool"],
          edges: ["app-pool"],
          token: { edgeId: "app-pool", tone: "primary", label: "login" },
          log: [
            { text: "client.login('admin', 's3cret') — same RBAC users as the GUI", tone: "mut" },
            { text: "only members in CONNECTED state are authenticated" },
          ],
        },
      ],
    },
    {
      title: "AUTHENTICATE over TCP",
      frames: [
        {
          nodes: ["auth"],
          edges: ["pool-auth"],
          token: { edgeId: "pool-auth", tone: "net", label: "AUTHENTICATE" },
          log: [
            { text: "sendCommand(CommandType.AUTHENTICATE, { username, password })", tone: "ok" },
            { text: "sent on every connected member — no one is left unauthenticated" },
          ],
        },
      ],
    },
    {
      title: "Server RBAC check",
      frames: [
        {
          nodes: ["rbac"],
          edges: ["auth-rbac"],
          token: { edgeId: "auth-rbac", tone: "success", label: "verify" },
          log: [
            { text: "server hashes + compares, maps to role, records mustChangePassword", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Identity + stashed creds",
      frames: [
        {
          nodes: ["user", "stash"],
          edges: ["rbac-user", "auth-stash", "user-stash"],
          token: { edgeId: "rbac-user", tone: "success", label: "identity" },
          log: [
            { text: "this.credentials = { username, password }  — for auto-replay", tone: "mut" },
            { text: "a dropped member re-logs-in on its next reconnect, no manual login needed", tone: "ok" },
          ],
        },
      ],
    },
  ],
};

/* ── 3. Message framing ────────────────────────────────────────────── */

const cloudFraming: Scenario = {
  id: "cloud-framing",
  title: "Message Framing",
  short: "binary TCP protocol",
  mode: "cloud",
  iconKey: "braces",
  description:
    "Every request is a `TCPRequest { id, command, params }` framed as `[4-byte length (uint32 BE)][JSON payload]`. The socket is the only stream, so a `MessageBuffer` accumulates chunks, splits complete messages, and matches each response back to its pending request by correlation id (`randomUUID()`).",
  code: `// source/tcp/config/protocol.ts
MessageFramer.encode(request);
// [0x0000004a][{"id":"...","command":"CREATE_DB",...}]

// pendingRequests Map<requestId, { resolve, timeout }>
// maturity signal: length-prefix makes partial TCP chunks safe`,
  viewBox: [1000, 430],
  nodes: [
    n("app", "sendCommand()", 40, 30, "call", "command + params", 190),
    n("uuid", "correlation id", 300, 30, "memory", "randomUUID()", 210),
    n("frame", "MessageFramer.encode", 560, 30, "process", "[4B len BE][JSON]", 230),
    n("socket", "TCP socket", 300, 170, "network", "write(buffer)", 210),
    n("buf", "MessageBuffer", 560, 170, "memory", "accumulates chunks", 230),
    n("pending", "pendingRequests Map", 560, 300, "memory", "id → { resolve, timeout }", 230),
    n("resp", "TCPResponse", 300, 300, "data", "statusCode 2xx · data", 210),
  ],
  edges: [
    e("app-uuid", "app", "uuid"),
    e("uuid-frame", "uuid", "frame"),
    e("frame-socket", "frame", "socket"),
    e("socket-buf", "socket", "buf"),
    e("buf-pending", "buf", "pending"),
    e("resp-app", "resp", "app", true),
  ],
  steps: [
    {
      title: "Build + frame",
      frames: [
        {
          nodes: ["app", "uuid", "frame"],
          edges: ["app-uuid", "uuid-frame"],
          token: { edgeId: "app-uuid", tone: "primary", label: "id" },
          log: [
            { text: "const request = { id: randomUUID(), command, params }", tone: "mut" },
            { text: "MessageFramer.encode → length prefix (uint32 BE) + JSON payload", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Write to the socket",
      frames: [
        {
          nodes: ["socket"],
          edges: ["frame-socket"],
          token: { edgeId: "frame-socket", tone: "net", label: "write" },
          log: [
            { text: "socket.write(buffer) — the only stream between client and server", tone: "net" },
            { text: "request id stored in pendingRequests with a resolve fn + timeout", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Reassemble chunks",
      frames: [
        {
          nodes: ["buf"],
          edges: ["socket-buf"],
          token: { edgeId: "socket-buf", tone: "primary", label: "chunk" },
          log: [
            { text: "MessageBuffer.addChunk() — TCP can split/merge messages, framing keeps them whole", tone: "ok" },
            { text: "HTTP bytes on the port → rejected with 'are you connecting to the correct port?'" },
          ],
        },
      ],
    },
    {
      title: "Correlate response",
      frames: [
        {
          nodes: ["pending", "resp"],
          edges: ["buf-pending", "resp-app"],
          token: { edgeId: "buf-pending", tone: "success", label: "match" },
          log: [
            { text: "response.id looked up in pendingRequests — 2xx resolves, other status rejects", tone: "ok" },
            { text: "timeout cleared, entry deleted — unknown ids warn instead of crash", tone: "mut" },
          ],
        },
      ],
    },
  ],
};

/* ── 4. Least-busy routing ─────────────────────────────────────────── */

const cloudRouting: Scenario = {
  id: "cloud-routing",
  title: "Least-busy Routing",
  short: "pick the idle member",
  mode: "cloud",
  iconKey: "waypoints",
  description:
    "`sendCommand()` routes each request through the connected pool member with the fewest in-flight requests (`pendingCount`), not round-robin. A connection stuck on a slow command therefore never receives more work while its siblings sit idle.",
  code: `// AxioDBCloud.pickConnection()
let best = null;
for (const c of this.pool) {
  if (c.state !== CONNECTED) continue;          // skip dead members
  if (!best || c.pendingCount < best.pendingCount) best = c;
}
return best; // sendCommand → least-busy member's socket`,
  viewBox: [1000, 380],
  nodes: [
    n("app", "db.users.insert()", 40, 30, "call", "any command", 210),
    n("route", "pickConnection()", 300, 30, "process", "fewest in-flight", 210),
    n("c1", "Member #1", 60, 170, "network", "pending = 3 · busy", 200),
    n("c2", "Member #2", 300, 170, "network", "pending = 0 · idle", 200),
    n("c3", "Member #3", 540, 170, "network", "pending = 1", 200),
    n("server", "AxioDBCloud server", 400, 300, "store", "TCP 27019", 200),
  ],
  edges: [
    e("app-route", "app", "route"),
    e("route-c1", "route", "c1"),
    e("route-c2", "route", "c2"),
    e("route-c3", "route", "c3"),
    e("c1-server", "c1", "server"),
    e("c2-server", "c2", "server"),
    e("c3-server", "c3", "server"),
  ],
  steps: [
    {
      title: "Command arrives",
      frames: [
        {
          nodes: ["app", "route"],
          edges: ["app-route"],
          token: { edgeId: "app-route", tone: "primary", label: "cmd" },
          log: [
            { text: "sendCommand() → route the request through the pool", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "Skip non-connected members",
      frames: [
        {
          nodes: ["c1", "c2", "c3"],
          edges: ["route-c1", "route-c2", "route-c3"],
          log: [
            { text: "pool members not in CONNECTED state are skipped entirely", tone: "warn" },
          ],
        },
      ],
    },
    {
      title: "Compare in-flight counts",
      frames: [
        {
          nodes: ["c1", "c2", "c3"],
          log: [
            { text: "Member #1: 3 in-flight · Member #2: 0 · Member #3: 1", tone: "ok" },
            { text: "least-busy wins — slow member #1 gets no more work" },
          ],
        },
      ],
    },
    {
      title: "Route to the idle member",
      frames: [
        {
          nodes: ["c2", "server"],
          edges: ["c2-server"],
          token: { edgeId: "c2-server", tone: "net", label: "route" },
          log: [
            { text: "command written to Member #2's socket — fewest pendingCount", tone: "net" },
            { text: "no head-of-line blocking across the pool" },
          ],
        },
      ],
    },
  ],
};

/* ── 5. TLS encryption ─────────────────────────────────────────────── */

const cloudTls: Scenario = {
  id: "cloud-tls",
  title: "TLS Encryption",
  short: "tls.connect + CA verify",
  mode: "cloud",
  iconKey: "lock",
  description:
    "With `tls: true`, each pool member connects via `tls.connect()` instead of a plain `net.Socket`. The CA from `tlsCAPath` is read once at the pool level and handed to every member as a Buffer; only `secureConnect` — which implies certificate validation passed — flips the member to CONNECTED.",
  code: `// PooledConnection.connect()
const socket = this.options.tls
  ? tlsConnect({ host, port, ca: this.tlsCA,
      rejectUnauthorized: true }, onReady)
  : new Socket();

// 'secureConnect' (TLS handshake + cert validation passed)
// fires stronger readiness than raw TCP 'connect'.`,
  viewBox: [1000, 400],
  nodes: [
    n("app", "tls: true", 40, 30, "call", "client options", 190),
    n("ca", "tlsCAPath → Buffer", 300, 30, "io", "read once at pool level", 210),
    n("tls", "tls.connect()", 560, 30, "network", "host · port · ca", 210),
    n("handshake", "TLS handshake", 560, 170, "network", "ServerHello · key exchange", 210),
    n("cert", "Certificate check", 300, 170, "auth", "rejectUnauthorized: true", 210),
    n("ready", "'secureConnect'", 300, 300, "data", "state = CONNECTED", 210),
  ],
  edges: [
    e("app-ca", "app", "ca"),
    e("ca-tls", "ca", "tls"),
    e("tls-handshake", "tls", "handshake"),
    e("handshake-cert", "handshake", "cert"),
    e("cert-ready", "cert", "ready"),
  ],
  steps: [
    {
      title: "Load the CA once",
      frames: [
        {
          nodes: ["app", "ca"],
          edges: ["app-ca"],
          token: { edgeId: "app-ca", tone: "primary", label: "CA" },
          log: [
            { text: "if (options.tlsCAPath) tlsCA = fs.readFileSync(tlsCAPath)", tone: "mut" },
            { text: "read once, handed to every pooled member as a Buffer — not per connection" },
          ],
        },
      ],
    },
    {
      title: "tls.connect instead of net",
      frames: [
        {
          nodes: ["tls"],
          edges: ["ca-tls"],
          token: { edgeId: "ca-tls", tone: "net", label: "encrypt" },
          log: [
            { text: "tls.connect({ host, port, ca, rejectUnauthorized: true })", tone: "net" },
            { text: "must match the server's own TLS setting", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Handshake + cert validation",
      frames: [
        {
          nodes: ["handshake", "cert"],
          edges: ["tls-handshake", "handshake-cert"],
          token: { edgeId: "handshake-cert", tone: "success", label: "verify" },
          log: [
            { text: "ServerHello, key exchange, finished — the wire is now encrypted", tone: "ok" },
            { text: "rejectUnauthorized: true validates server identity against the CA" },
          ],
        },
      ],
    },
    {
      title: "secureConnect → connected",
      frames: [
        {
          nodes: ["ready"],
          edges: ["cert-ready"],
          token: { edgeId: "cert-ready", tone: "success", label: "secured" },
          log: [
            { text: "'secureConnect' implies cert validation passed — stronger than TCP 'connect'", tone: "mut" },
            { text: "state = CONNECTED; heartbeat starts" },
          ],
        },
      ],
    },
  ],
};

/* ── 6. Heartbeat PING ─────────────────────────────────────────────── */

const cloudHeartbeat: Scenario = {
  id: "cloud-heartbeat",
  title: "Heartbeat (PING)",
  short: "keep the socket warm",
  mode: "cloud",
  iconKey: "heart-pulse",
  description:
    "Every connected member runs a `setInterval` that sends the no-arg PING command every `heartbeatInterval` (default 30s). A failed heartbeat just logs a warning — it's the socket-level close/error that triggers the real disconnect + reconnect path.",
  code: `// PooledConnection.startHeartbeat()
this.heartbeatInterval = setInterval(async () => {
  try {
    await this.sendCommand(CommandType.PING, {});
  } catch (error) {
    Logger.warn('[AxioDBCloud] Heartbeat failed:', error);
  }
}, this.options.heartbeatInterval);  // default 30_000 ms`,
  viewBox: [1000, 320],
  nodes: [
    n("tick", "setInterval", 40, 30, "call", "every 30_000 ms", 210),
    n("ping", "PING command", 300, 30, "network", "{} params", 210),
    n("stream", "TCP stream", 560, 30, "network", "keep-alive", 210),
    n("server", "Server reply", 560, 170, "store", "PING → pong", 210),
    n("fail", "heartbeat failed", 290, 170, "decor", "warn only", 200),
  ],
  edges: [
    e("tick-ping", "tick", "ping"),
    e("ping-stream", "ping", "stream"),
    e("stream-server", "stream", "server"),
    e("fail-tick", "fail", "tick", true),
  ],
  steps: [
    {
      title: "Interval starts on connect",
      frames: [
        {
          nodes: ["tick", "ping"],
          edges: ["tick-ping"],
          token: { edgeId: "tick-ping", tone: "primary", label: "PING" },
          log: [
            { text: "startHeartbeat() is called as soon as a member reaches CONNECTED", tone: "mut" },
            { text: "default heartbeatInterval 30_000 ms — same cadence as MongoDB's driver" },
          ],
        },
      ],
    },
    {
      title: "Ping crosses the wire",
      frames: [
        {
          nodes: ["stream"],
          edges: ["ping-stream"],
          token: { edgeId: "ping-stream", tone: "net", label: "ping" },
          log: [
            { text: "sendCommand(CommandType.PING, {}) — no params required", tone: "net" },
          ],
        },
      ],
    },
    {
      title: "Server replies",
      frames: [
        {
          nodes: ["server"],
          edges: ["stream-server"],
          token: { edgeId: "stream-server", tone: "success", label: "pong" },
          log: [
            { text: "2xx response resolves immediately — connection stays warm", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Failure is non-fatal",
      frames: [
        {
          nodes: ["fail"],
          edges: ["fail-tick"],
          token: { edgeId: "fail-tick", tone: "warning", label: "warn" },
          log: [
            { text: "a failed heartbeat only logs a warning — it never kills the socket", tone: "warn" },
            { text: "close / error / end events drive the actual disconnect path" },
          ],
        },
      ],
    },
  ],
};

/* ── 7. Exponential-backoff reconnect ──────────────────────────────── */

const cloudReconnect: Scenario = {
  id: "cloud-reconnect",
  title: "Reconnect & Backoff",
  short: "exponential retry",
  mode: "cloud",
  iconKey: "rotate-ccw",
  description:
    "When a member drops, all in-flight requests are rejected with 'Connection lost' and the member reconnects with exponential backoff: `reconnectDelay × 2^(attempt−1)` capped at 30s. Reconnects replay the stashed credentials; when attempts run out the member goes FAILED and emits `onExhausted`.",
  code: `// PooledConnection.attemptReconnect()
const delay = Math.min(
  this.options.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
  30000,               // cap: 1s → 2s → 4s → … → 30s
);
this.state = RECONNECTING;
setTimeout(() => this.connect(), delay);
// on success → onReconnected() + replay of stashed login()`,
  viewBox: [1000, 420],
  nodes: [
    n("drop", "socket close/error", 40, 30, "network", "'end' · 'error' · 'close'", 210),
    n("pend", "Reject in-flight", 300, 30, "process", "'Connection lost'", 210),
    n("backoff", "Exponential backoff", 560, 30, "memory", "1s → 2s → … → 30s cap", 230),
    n("recon", "connect() again", 300, 170, "network", "state = RECONNECTING", 210),
    n("relog", "Replay login()", 560, 170, "auth", "stashed credentials", 210),
    n("ok", "Reconnected", 560, 300, "data", "onReconnected()", 210),
    n("fail", "FAILED · onExhausted", 300, 300, "decor", "attempts exhausted", 210),
  ],
  edges: [
    e("drop-pend", "drop", "pend"),
    e("pend-backoff", "pend", "backoff"),
    e("backoff-recon", "backoff", "recon"),
    e("recon-relog", "recon", "relog"),
    e("relog-ok", "relog", "ok"),
    e("recon-fail", "recon", "fail", true),
  ],
  steps: [
    {
      title: "Disconnection detected",
      frames: [
        {
          nodes: ["drop", "pend"],
          edges: ["drop-pend"],
          token: { edgeId: "drop-pend", tone: "error", label: "lost" },
          log: [
            { text: "socket 'close' / 'error' / 'end' → handleDisconnection()", tone: "err" },
            { text: "heartbeat stopped, listeners removed" },
          ],
        },
      ],
    },
    {
      title: "Reject in-flight work",
      frames: [
        {
          nodes: ["pend"],
          log: [
            { text: "every pendingRequests entry rejects with 'Connection lost'", tone: "warn" },
            { text: "no command hangs forever on a dead socket" },
          ],
        },
      ],
    },
    {
      title: "Exponential backoff",
      frames: [
        {
          nodes: ["backoff"],
          edges: ["pend-backoff"],
          token: { edgeId: "pend-backoff", tone: "warning", label: "backoff" },
          log: [
            { text: "delay = reconnectDelay × 2^(attempt−1), capped at 30_000 ms", tone: "mut" },
            { text: "state = RECONNECTING — surface on the client as reconnecting(n)", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Reconnect + re-auth",
      frames: [
        {
          nodes: ["recon", "relog"],
          edges: ["backoff-recon", "recon-relog"],
          token: { edgeId: "recon-relog", tone: "net", label: "login" },
          log: [
            { text: "connect() replays the stashed username/password automatically", tone: "ok" },
            { text: "never silently reconnects unauthenticated" },
          ],
        },
      ],
    },
    {
      title: "Recovered or exhausted",
      frames: [
        {
          nodes: ["ok", "fail"],
          edges: ["relog-ok", "recon-fail"],
          token: { edgeId: "relog-ok", tone: "success", label: "online" },
          log: [
            { text: "success → onReconnected(); attempts reset to 0", tone: "ok" },
            { text: "attempts exhausted → FAILED + onExhausted → all-failed pool emits 'failed'", tone: "warn" },
          ],
        },
      ],
    },
  ],
};

/* ── 8. Graceful disconnect ────────────────────────────────────────── */

const cloudDisconnect: Scenario = {
  id: "cloud-disconnect",
  title: "Graceful Disconnect",
  short: "DISCONNECT + socket.end",
  mode: "cloud",
  iconKey: "unplug",
  description:
    "`client.disconnect()` tears down every pool member: it sets the member's reconnect attempts to max so nothing can reconnect, stops the heartbeat, sends the no-arg DISCONNECT command politely, then `socket.end()` and flattens the pool to empty.",
  code: `// PooledConnection.disconnect()
this.reconnectAttempt = this.options.reconnectAttempts; // no auto-reconnect
this.stopHeartbeat();
await this.sendCommand(CommandType.DISCONNECT, {});      // polite FIN
this.socket.end();
this.state = DISCONNECTED;                              // never reconnects

// AxioDBCloud.disconnect()
await Promise.all(this.pool.map((c) => c.disconnect()));
this.pool = [];`,
  viewBox: [1000, 380],
  nodes: [
    n("app", "client.disconnect()", 40, 30, "call", "close the pool", 210),
    n("cap", "reconnectAttempt = max", 300, 30, "process", "prevents reconnect", 230),
    n("hb", "stopHeartbeat()", 560, 30, "process", "clearInterval", 210),
    n("cmd", "DISCONNECT cmd", 300, 170, "network", "{} params", 210),
    n("end", "socket.end()", 560, 170, "process", "graceful FIN", 210),
    n("done", "state = DISCONNECTED", 560, 300, "decor", "pool = []", 210),
  ],
  edges: [
    e("app-cap", "app", "cap"),
    e("cap-hb", "cap", "hb"),
    e("hb-cmd", "hb", "cmd"),
    e("cmd-end", "cmd", "end"),
    e("end-done", "end", "done"),
  ],
  steps: [
    {
      title: "Cap reconnect attempts",
      frames: [
        {
          nodes: ["app", "cap"],
          edges: ["app-cap"],
          token: { edgeId: "app-cap", tone: "primary", label: "close" },
          log: [
            { text: "reconnectAttempt = max — a disconnected member never auto-reconnects", tone: "mut" },
            { text: "Promise.all over the pool so every member tears down" },
          ],
        },
      ],
    },
    {
      title: "Stop the heartbeat",
      frames: [
        {
          nodes: ["hb"],
          edges: ["cap-hb"],
          token: { edgeId: "cap-hb", tone: "warning", label: "stop" },
          log: [
            { text: "clearInterval(heartbeatInterval) — no more PINGs", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "Politely say DISCONNECT",
      frames: [
        {
          nodes: ["cmd"],
          edges: ["hb-cmd"],
          token: { edgeId: "hb-cmd", tone: "net", label: "DISCONNECT" },
          log: [
            { text: "sendCommand(DISCONNECT, {}) lets the server clean up session state", tone: "net" },
            { text: "failure here is swallowed — the close still proceeds" },
          ],
        },
      ],
    },
    {
      title: "Close the socket",
      frames: [
        {
          nodes: ["end", "done"],
          edges: ["cmd-end", "end-done"],
          token: { edgeId: "end-done", tone: "success", label: "FIN" },
          log: [
            { text: "socket.end() → graceful FIN; listeners removed", tone: "ok" },
            { text: "state = DISCONNECTED and pool = [] — client completely shut down" },
          ],
        },
      ],
    },
  ],
};

/* ── 9. Transaction connection-pinning ─────────────────────────────── */

const cloudPin: Scenario = {
  id: "cloud-pin",
  title: "Transaction Pinning",
  short: "one socket per txn",
  mode: "cloud",
  iconKey: "pin",
  description:
    "A remote transaction pins every command to a single pool member: `getPinnedConnection()` picks the least-busy member once and `TransactionProxy` sends BEGIN, in-transaction writes, reads and COMMIT through that same socket, so in-flight writes stay visible to later reads in the same transaction.",
  code: `// CollectionProxy.beginTransaction()
const conn = this.client.getPinnedConnection();  // least-busy member
const txn = new TransactionProxy(client, id, db, coll, conn);

await txn.insert({ name: 'Alice' });   // pinned → member socket
await txn.findByIds([id]);             // pinned → SAME socket
await txn.commit();                    // pinned → SAME socket`,
  viewBox: [1000, 400],
  nodes: [
    n("app", "collection.beginTransaction()", 40, 30, "call", "TransactionProxy", 230),
    n("pin", "getPinnedConnection()", 320, 30, "process", "least-busy member", 210),
    n("c1", "Member #1", 60, 170, "network", "txn socket", 190),
    n("c2", "Member #2", 300, 170, "network", "idle", 190),
    n("server", "Server transaction", 560, 170, "store", "BEGIN · insert · COMMIT", 230),
    n("vis", "Writes visible to reads", 560, 300, "data", "same connection" , 230),
  ],
  edges: [
    e("app-pin", "app", "pin"),
    e("pin-c1", "pin", "c1"),
    e("pin-c2", "pin", "c2"),
    e("c1-server", "c1", "server"),
    e("c2-server", "c2", "server", true),
    e("server-vis", "server", "vis"),
  ],
  steps: [
    {
      title: "Pick the pinned member",
      frames: [
        {
          nodes: ["app", "pin", "c1", "c2"],
          edges: ["app-pin", "pin-c1", "pin-c2"],
          token: { edgeId: "pin-c1", tone: "primary", label: "pin" },
          log: [
            { text: "getPinnedConnection() = pickConnection() — the least-busy member", tone: "mut" },
            { text: "the member, not its id, is what carries state during the txn", tone: "ok" },
          ],
        },
      ],
    },
    {
      title: "BEGIN + writes on the pinned socket",
      frames: [
        {
          nodes: ["c1", "server"],
          edges: ["c1-server", "c2-server"],
          token: { edgeId: "c1-server", tone: "net", label: "INSERT" },
          log: [
            { text: "txn.insert() and txn.update() both use sendPinnedCommand(pinned)", tone: "net" },
            { text: "other members are never used for this transaction (dashed = skipped)", tone: "warn" },
          ],
        },
      ],
    },
    {
      title: "Reads see in-flight writes",
      frames: [
        {
          nodes: ["server", "vis"],
          edges: ["server-vis"],
          token: { edgeId: "server-vis", tone: "success", label: "visible" },
          log: [
            { text: "txn.findByIds() reuses the same socket → its uncommitted write is visible", tone: "ok" },
            { text: "a different socket would miss staged writes — that's why pinning exists", tone: "mut" },
          ],
        },
      ],
    },
    {
      title: "COMMIT through the same socket",
      frames: [
        {
          nodes: ["server", "vis"],
          edges: ["server-vis"],
          token: { edgeId: "server-vis", tone: "success", label: "COMMIT" },
          log: [
            { text: "txn.commit() → COMMIT_TRANSACTION on the pinned member", tone: "ok" },
            { text: "rollback/savepoints work over the same pin for the same reason" },
          ],
        },
      ],
    },
  ],
};

export const cloudScenarios: Scenario[] = [
  cloudConnect,
  cloudAuth,
  cloudFraming,
  cloudRouting,
  cloudTls,
  cloudHeartbeat,
  cloudReconnect,
  cloudDisconnect,
  cloudPin,
];