import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import {
  LifeBuoy,
  AlertCircle,
  Lock,
  Clock,
  ShieldAlert,
  WifiOff,
  Package,
  ExternalLink,
} from "lucide-react";

interface TroubleshootingItem {
  icon: React.ElementType;
  title: string;
  body: React.ReactNode;
}

const items: TroubleshootingItem[] = [
  {
    icon: AlertCircle,
    title: `"Not connected to server" right after calling connect()`,
    body: (
      <>
        <p className="text-slate-300 mb-4">
          <code className="px-1.5 py-0.5 bg-slate-900 rounded">client.connect()</code> is
          asynchronous and must be <code className="px-1.5 py-0.5 bg-slate-900 rounded">await</code>ed
          before you use the connection — it only resolves once the TCP handshake (and, if{" "}
          <code className="px-1.5 py-0.5 bg-slate-900 rounded">TCPAuth</code> is on, the{" "}
          <code className="px-1.5 py-0.5 bg-slate-900 rounded">AUTHENTICATE</code> round-trip) has
          completed.
        </p>
        <CodeBlock
          language="javascript"
          code={`// ❌ Wrong — races ahead before the connection (and login) finish
client.connect();
console.log(client.authenticatedUser); // undefined
await client.createDB("MyDB");         // "Not connected to server"

// ✅ Right
await client.connect();
console.log(client.authenticatedUser); // populated
await client.createDB("MyDB");         // works`}
        />
      </>
    ),
  },
  {
    icon: Lock,
    title: `401 — "Authentication required..."`,
    body: (
      <p className="text-slate-300">
        You're running with <code className="px-1.5 py-0.5 bg-slate-900 rounded">TCPAuth: true</code> and
        sent a command before a successful <code className="px-1.5 py-0.5 bg-slate-900 rounded">AUTHENTICATE</code>.
        Either pass <code className="px-1.5 py-0.5 bg-slate-900 rounded">{"{ username, password }"}</code> in
        the <code className="px-1.5 py-0.5 bg-slate-900 rounded">AxioDBCloud</code> constructor (it
        auto-authenticates on <code className="px-1.5 py-0.5 bg-slate-900 rounded">connect()</code>), or
        call <code className="px-1.5 py-0.5 bg-slate-900 rounded">await client.login(username, password)</code> yourself
        before any other command.
      </p>
    ),
  },
  {
    icon: ShieldAlert,
    title: `403 — "This account must change its password before it can be used over TCP..."`,
    body: (
      <p className="text-slate-300">
        Your credentials are correct, but that account is still flagged for a forced password
        change — true for the default <code className="px-1.5 py-0.5 bg-slate-900 rounded">admin</code>/
        <code className="px-1.5 py-0.5 bg-slate-900 rounded">admin</code> account, and for any newly
        created user. Log into the GUI at{" "}
        <code className="px-1.5 py-0.5 bg-slate-900 rounded">http://localhost:27018</code>, sign in,
        and complete the password change there — there's no TCP command for this yet. Then
        reconnect with the new password, or use a different account that has already completed
        its change.
      </p>
    ),
  },
  {
    icon: Clock,
    title: `429 — "Too many failed login attempts..."`,
    body: (
      <p className="text-slate-300">
        Five failed logins from your IP within a trailing 15-minute window trigger a 15-minute
        lockout, shared between TCP and the GUI. Double-check the credentials you're sending,
        wait out the cooldown, or fix the underlying typo/config issue causing repeated failures
        — there's no way to clear the lockout early.
      </p>
    ),
  },
  {
    icon: ShieldAlert,
    title: `403 — "This is a reserved system database"`,
    body: (
      <p className="text-slate-300">
        You (or a client) tried to read/write a database literally named{" "}
        <code className="px-1.5 py-0.5 bg-slate-900 rounded">config</code> — that name is reserved
        for AxioDB's own RBAC storage (<code className="px-1.5 py-0.5 bg-slate-900 rounded">users</code>/
        <code className="px-1.5 py-0.5 bg-slate-900 rounded">roles</code>/
        <code className="px-1.5 py-0.5 bg-slate-900 rounded">permissions</code>) and is blocked on
        both the GUI and TCP, authenticated or not. Use a different database name.
      </p>
    ),
  },
  {
    icon: WifiOff,
    title: `Connection refused / timeout connecting to axiodb://host:27019`,
    body: (
      <ul className="text-sm text-slate-300 space-y-2">
        <li>
          • Confirm the server was started with <code className="px-1 py-0.5 bg-slate-900 rounded">TCP: true</code> (or,
          in Docker, <code className="px-1 py-0.5 bg-slate-900 rounded">AXIODB_TCP=true</code>, the default).
        </li>
        <li>
          • Confirm the port is published: <code className="px-1 py-0.5 bg-slate-900 rounded">-p 27019:27019</code> on{" "}
          <code className="px-1 py-0.5 bg-slate-900 rounded">docker run</code>, or that nothing else on
          the host is bound to 27019.
        </li>
        <li>
          • If you're getting a protocol error mentioning "Message exceeds maximum size" or
          "Received HTTP data on TCP port," you're likely pointed at the GUI port (27018)
          instead of the TCP port (27019) — check your connection string.
        </li>
      </ul>
    ),
  },
  {
    icon: Package,
    title: "Docker container won't start, port conflicts, or data not persisting",
    body: (
      <p className="text-slate-300">
        See the <a href="/docker" className="underline font-medium">Docker Deployment</a> page,
        and{" "}
        <a
          href="https://github.com/nexoral/AxioDB/blob/main/Docker/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 underline font-medium"
        >
          Docker/README.md <ExternalLink className="h-3.5 w-3.5" />
        </a>{" "}
        in the repository for a fuller Docker-specific troubleshooting guide (
        <code className="px-1 py-0.5 bg-slate-900 rounded">docker logs</code>, port-conflict
        remapping, volume-mounting checklist).
      </p>
    ),
  },
];

const Troubleshooting: React.FC = () => {
  return (
    <div className="space-y-12">
      <Seo
        title="Troubleshooting | AxioDB Documentation"
        description="Common AxioDB connection and authentication errors - AxioDBCloud, TCP auth, rate limiting, and Docker issues - with fixes."
        path="/troubleshooting"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 via-slate-800 to-orange-900/20 rounded-2xl p-8 lg:p-12 border border-amber-700 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-full border border-amber-600 mb-6">
            <LifeBuoy className="h-5 w-5 text-amber-400" />
            <span className="text-amber-300 font-semibold">
              TROUBLESHOOTING
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Troubleshooting
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
            The errors you're most likely to hit connecting to AxioDBCloud or logging into the
            GUI, in the exact wording AxioDB returns, with the real fix for each.
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="space-y-6">
        {items.map((item) => (
          <div
            key={item.title}
            className="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-900/30 rounded-lg">
                <item.icon className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {item.title}
              </h3>
            </div>
            {item.body}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Troubleshooting;
