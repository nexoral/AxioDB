import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import {
  Cloud,
  Server,
  Zap,
  Shield,
  RefreshCw,
  Activity,
  Globe,
  CheckCircle,
  ArrowRight,
  Package,
  Terminal,
  Code2,
  Network,
  Lock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

const AxioDBCloud: React.FC = () => {
  return (
    <div className="space-y-12">
      <Seo
        title="AxioDBCloud - Remote Database Access | AxioDB Documentation"
        description="Connect to AxioDB remotely over TCP with AxioDBCloud - simple and authenticated (TCPAuth) connection modes, Docker deployment, and the same API as embedded AxioDB."
        path="/cloud"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 border border-blue-200 dark:border-blue-700 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full border border-blue-300 dark:border-blue-600 mb-6">
            <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              NEW FEATURE
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            AxioDBCloud
          </h1>

          <p className="text-2xl lg:text-3xl text-slate-700 dark:text-slate-200 font-medium mb-4">
            Remote Database Access Made Simple
          </p>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Deploy AxioDB in Docker or Cloud. Connect from anywhere with the same API you already know.
            Zero code changes, production-ready TCP protocol, automatic reconnection.
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          Why AxioDBCloud?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Zero Code Changes
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Use the exact same API as embedded AxioDB. Just change from <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">new AxioDB()</code> to <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">new AxioDBCloud()</code>
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Deploy Anywhere
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Docker, AWS, Azure, Google Cloud, DigitalOcean, or your own servers. One instance, unlimited clients.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Auto-Reconnect
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Built-in exponential backoff reconnection. Up to 10 retry attempts. Your app stays resilient.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Production Ready
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              1000+ concurrent connections, heartbeat monitoring, request correlation, connection pooling.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start - Server */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Server className="h-8 w-8 text-blue-500" />
          Server Setup
        </h2>

        <div className="space-y-6">
          {/* Docker Method - pointer to dedicated page */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-blue-500" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Option 1: Docker (Recommended)
              </h3>
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The easiest way to deploy AxioDB with TCP access. Full instructions — simple
              <code className="px-1.5 py-0.5 mx-1 bg-slate-100 dark:bg-slate-900 rounded">docker run</code>
              quick start, then advanced env vars, volumes, and Compose — live on the dedicated Docker page:
            </p>

            <a
              href="/docker"
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Package className="h-4 w-4" />
              Docker Deployment Guide
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Node.js Method */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="h-6 w-6 text-green-500" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Option 2: Node.js Application
              </h3>
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Using this config, you can expose an AxioDB instance running inside one service (Service A)
              so it can be reached over TCP from another service (Service B) using the <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">AxioDBCloud</code> client
              — no shared filesystem, no HTTP layer, just a direct TCP connection between processes:
            </p>

            <CodeBlock
              language="javascript"
              code={`const { AxioDB } = require('axiodb');

// Service A: the process that owns the data, exposed for other services to reach
const db = new AxioDB({
  GUI: false,              // GUI (optional)
  RootName: 'MyDatabase',  // Root database name
  CustomPath: './data',    // Data directory
  TCP: true                // Enable TCP server
});

// Server automatically starts on port 27019
console.log('AxioDB TCP Server running on port 27019');`}
            />

            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Default Port:</strong> TCP server listens on port <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">27019</code> (HTTP GUI uses 27018).
                Service B then connects with <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">new AxioDBCloud("axiodb://service-a-host:27019")</code> — see{" "}
                <a href="#client-usage" className="underline font-medium">Client Usage</a> below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Usage */}
      <section id="client-usage" className="scroll-mt-20">
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Globe className="h-8 w-8 text-purple-500" />
          Client Usage
        </h2>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Basic Connection
            </h3>

            <CodeBlock
              language="javascript"
              code={`const { AxioDBCloud } = require('axiodb');

// Connect to remote AxioDB server
const client = new AxioDBCloud("axiodb://localhost:27019");

// Establish connection
await client.connect();

// Use exactly like embedded AxioDB!
const db = await client.createDB("ProductionDB");
const users = await db.createCollection("Users");

// All operations work identically
await users.insert({ name: "Alice", email: "alice@example.com" });

const results = await users.query({ name: "Alice" })
  .Limit(10)
  .Skip(0)
  .Sort({ createdAt: -1 })
  .exec();

console.log(results);

// Disconnect when done
await client.disconnect();`}
            />
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-2">
              Connection String Format
            </h4>
            <code className="text-sm text-purple-800 dark:text-purple-300">
              axiodb://[host]:[port]
            </code>
            <ul className="mt-2 text-sm text-purple-800 dark:text-purple-300 space-y-1">
              <li>• Local: <code>axiodb://localhost:27019</code></li>
              <li>• Remote: <code>axiodb://192.168.1.100:27019</code></li>
              <li>• Cloud: <code>axiodb://mydb.example.com:27019</code></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Advanced Options
            </h3>

            <CodeBlock
              language="javascript"
              code={`const client = new AxioDBCloud("axiodb://localhost:27019", {
  timeout: 30000,           // Request timeout (ms)
  reconnectAttempts: 10,    // Max reconnect attempts
  reconnectDelay: 1000,     // Initial delay (ms)
  heartbeatInterval: 30000, // Heartbeat every 30s
  maxPoolSize: 10,          // Concurrent connections in the pool (default: 10)
  username: 'admin',        // Only needed if the server has TCPAuth: true
  password: 'admin',
});`}
            />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              <strong>maxPoolSize</strong> mirrors MongoDB&apos;s driver option of the same name.
              AxioDBCloud opens this many concurrent TCP connections to the server and routes
              each command to whichever connected member currently has the fewest in-flight
              requests (least-busy), so a burst of concurrent requests isn&apos;t serialized over
              a single socket, and a slow command on one connection doesn&apos;t queue new work
              behind it while other members sit idle. Each pooled connection reconnects and
              re-authenticates independently, so one dropped connection never blocks commands
              routed to the others.
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Each pool member is a socket, and the server holds one socket per connected
              client - both count against the OS&apos;s open-file-descriptor limit
              (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">ulimit -n</code>,
              often 1024 by default on Linux). At the default pool size that&apos;s enough for
              roughly 100 clients before the server starts refusing new connections. If you&apos;re
              deploying towards the 1,000+ concurrent connections the server supports, raise the
              limit (e.g. <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">ulimit -n 65536</code>,
              or <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">docker run --ulimit nofile=65536:65536</code>)
              rather than raising <strong>maxPoolSize</strong> per client.
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              The server also caps concurrent connections at 100 per remote IP, independent of
              the global 1,000-connection budget - so a single misbehaving or malicious client
              can&apos;t claim the entire pool of server connections for itself. This is checked
              at connect time, before authentication, and rejects the extra connection with a{" "}
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">429</code>{" "}
              (&quot;Too many concurrent connections from this IP address&quot;). A single client
              at the default <strong>maxPoolSize: 10</strong> is nowhere near this limit.
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              If <strong>maxPoolSize</strong> asks for more connections than the server allows
              (from the per-IP cap above, or any other reason a handful of pool members fail),
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">connect()</code>{" "}
              doesn&apos;t reject outright - it resolves as long as at least one pool member
              connected, and emits a <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">poolDegraded</code>{" "}
              event so the app knows it&apos;s running with fewer connections than requested
              instead of failing (or silently under capacity):
            </p>
            <CodeBlock
              language="javascript"
              code={`client.on('poolDegraded', ({ requested, connected, failed, errors }) => {
  console.warn(\`Pool came up smaller than requested: \${connected}/\${requested} connected, \${failed} failed\`);
  console.warn(errors[0].message); // e.g. "Too many concurrent connections from this IP address"
});

await client.connect(); // resolves even if some pool members were rejected`}
            />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              The one exception is the very first connection in the pool - if that one fails,
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">connect()</code>{" "}
              still rejects entirely, since it&apos;s the signal that the server is reachable
              and credentials are valid at all.
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              The 100-per-IP cap only bounds <em>concurrent</em> connections - by itself it
              wouldn&apos;t stop an attacker who never holds more than a few sockets open but
              rapidly opens and drops them, since each attempt still costs a TCP handshake and
              an accept/reject cycle. A separate per-IP rate limiter tracks connection{" "}
              <em>attempts</em> (successful or rejected, either counts) in a trailing 10-second
              window; once an IP crosses 300 attempts, every new connection from it is rejected
              with a <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">429</code>{" "}
              for the next 30 seconds. A normal client - even one repeatedly reconnecting a full{" "}
              <strong>maxPoolSize: 10</strong> pool - is nowhere near this threshold.
            </p>
          </div>
        </div>
      </section>

      {/* TCP Authentication */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Lock className="h-8 w-8 text-emerald-500" />
          TCP Authentication (NEW!)
        </h2>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <p className="text-slate-700 dark:text-slate-300">
            TCP connections are unauthenticated by default (unchanged from before). Opt in with{" "}
            <code className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded">TCPAuth: true</code> to require a
            username/password on every connection - it reuses the <strong>exact same accounts and roles</strong> as
            the GUI Control Server&apos;s RBAC system, so there&apos;s only one set of credentials to manage.
          </p>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Server</h3>
            <CodeBlock
              language="javascript"
              code={`const db = new AxioDB({
  TCP: true,
  TCPAuth: true,           // Require authentication on every TCP connection
  RootName: 'MyDatabase',
  CustomPath: './data',
});`}
            />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Client</h3>
            <CodeBlock
              language="javascript"
              code={`// Pass credentials in the constructor options - connect() authenticates automatically
const client = new AxioDBCloud("axiodb://localhost:27019", {
  username: 'admin',
  password: 'admin',
});
await client.connect();

console.log(client.authenticatedUser);
// { username: 'admin', role: 'Super Admin', mustChangePassword: false }

// Or authenticate after connecting (e.g. credentials supplied at runtime)
const client2 = new AxioDBCloud("axiodb://localhost:27019");
await client2.connect();
await client2.login('admin', 'admin');`}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2">What&apos;s enforced</h4>
              <ul className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1.5">
                <li>• Every command except PING/DISCONNECT/AUTHENTICATE requires a prior successful login on that connection</li>
                <li>• Same role permissions as the GUI, checked per command (e.g. a View-role user gets 403 on CREATE_DB)</li>
                <li>• Shared per-IP login rate limiter with the GUI: 5 failed attempts in 15 minutes locks that IP out for 15 minutes (429)</li>
                <li>• Accounts still needing their forced password change are rejected outright (403) - complete it via the GUI first</li>
                <li>• A password reset, role change, or deletion via the GUI immediately forces an already-open TCP connection to re-authenticate</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Known limitations
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1.5">
                <li>• No TCP command exists yet to change a password - that must go through the GUI</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TLS Encryption */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          TLS Encryption (NEW!)
        </h2>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <p className="text-slate-700 dark:text-slate-300">
            By default, the TCP protocol is <strong>plaintext</strong> - anyone who can capture
            network traffic between client and server (e.g. Wireshark on a shared network) can
            read your data and, if <code className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded">TCPAuth</code>{" "}
            is on, your password. TLS fixes this. It&apos;s <strong>off by default</strong> -
            nothing here is required, and existing plaintext deployments keep working exactly as
            before unless you turn it on.
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            <strong>You must provide your own certificate + key.</strong> AxioDB never generates
            one for you - that&apos;s a security decision only you can make (a real cert from a
            CA, or a self-signed one for local/private use).
          </p>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Step 1 - Get a cert + key
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-3">
              For local/dev/private use, generate a self-signed one (one-time, takes a second):
            </p>
            <CodeBlock
              language="bash"
              code={`openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"`}
            />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              This creates two files, <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">cert.pem</code>{" "}
              and <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">key.pem</code>, in your current
              folder. For a real production deployment reachable from the internet, use a cert
              from a real CA (Let&apos;s Encrypt, your org&apos;s CA, your cloud provider&apos;s
              managed cert) instead - the rest of the setup is identical either way.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Step 2 - Point the server at them
            </h3>
            <CodeBlock
              language="javascript"
              code={`const { AxioDB } = require('axiodb');
const db = new AxioDB({
  TCP: true,
  TLS: true,
  TLSCertPath: './cert.pem', // path to the file from step 1
  TLSKeyPath: './key.pem',
});`}
            />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              If <strong>TLS: true</strong> but either path is missing or unreadable, AxioDB
              throws immediately at startup - it never silently falls back to plaintext.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Step 3 - Point the client at the same cert
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-3">
              Only needed because it&apos;s self-signed - a real CA-issued cert wouldn&apos;t
              need this step, the same way your browser trusts <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">https://</code> sites
              without extra setup:
            </p>
            <CodeBlock
              language="javascript"
              code={`const { AxioDBCloud } = require('axiodb');
const client = new AxioDBCloud("axiodb://localhost:27019", {
  tls: true,
  tlsCAPath: './cert.pem', // same cert.pem from step 1 - proves this server is the real one
});
await client.connect();`}
            />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Without <strong>tlsCAPath</strong>, the client refuses to connect to a self-signed
              server by default (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">tlsRejectUnauthorized</code>{" "}
              defaults to <strong>true</strong>) - this is intentional, the same protection that
              stops a browser from silently trusting a fake <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">https://</code> site.
              Only set <strong>tlsRejectUnauthorized: false</strong> for local/dev testing, never
              in production, since it turns that protection off entirely.
            </p>
          </div>

          <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700">
            <h4 className="font-bold text-sky-900 dark:text-sky-200 mb-2">Running this in Docker?</h4>
            <p className="text-sm text-sky-800 dark:text-sky-300 mb-3">
              The cert/key files need to get <em>into</em> the container. The simplest way to
              think about it: your cert files live on your real machine; a Docker{" "}
              <strong>bind mount</strong> (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">-v</code>)
              makes a folder from your machine visible inside the container at whatever path you
              choose, and you point the env vars at <em>that in-container path</em>, not your
              real machine&apos;s path:
            </p>
            <CodeBlock
              language="bash"
              code={`# cert.pem and key.pem are really at /home/you/mycerts/ on your machine.
# "/certs" below is just a name we're choosing for where they'll appear inside the container.
docker run -d --name axiodb-server \\
  -p 27018:27018 -p 27019:27019 \\
  -v /home/you/mycerts:/certs:ro \\
  -e AXIODB_TLS=true \\
  -e AXIODB_TLS_CERT_PATH=/certs/cert.pem \\
  -e AXIODB_TLS_KEY_PATH=/certs/key.pem \\
  theankansaha/axiodb`}
            />
            <p className="mt-3 text-sm text-sky-800 dark:text-sky-300">
              The rule: the <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">AXIODB_TLS_CERT_PATH</code>{" "}
              value must always match the <em>right-hand side</em> of the{" "}
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">-v</code> mount
              (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">/certs/...</code>),
              never the real path on your machine - the container can&apos;t see your
              machine&apos;s filesystem directly, only whatever you&apos;ve explicitly mounted
              into it.
            </p>
          </div>
        </div>
      </section>

      {/* Complete API Examples */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Code2 className="h-8 w-8 text-indigo-500" />
          Complete API Examples
        </h2>

        <div className="space-y-6">
          {/* CRUD Operations */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              CRUD Operations
            </h3>

            <CodeBlock
              language="javascript"
              code={`// Insert single document
await users.insert({ name: "Bob", age: 30 });

// Insert multiple documents
await users.insertMany([
  { name: "Charlie", age: 25 },
  { name: "Diana", age: 28 }
]);

// Query documents
const adults = await users.query({ age: { $gte: 18 } })
  .Limit(10)
  .Sort({ age: -1 })
  .exec();

// Update document
await users.update({ name: "Bob" }).UpdateOne({ age: 31 });

// Delete document
await users.delete({ name: "Charlie" }).deleteOne();

// Aggregation
const stats = await users.aggregate([
  { $match: { age: { $gte: 25 } } },
  { $group: { _id: null, avgAge: { $avg: "$age" } } }
]).exec();`}
            />
          </div>

          {/* Real-world Example */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Real-World Example: E-commerce App
            </h3>

            <CodeBlock
              language="javascript"
              code={`const { AxioDBCloud } = require('axiodb');

async function main() {
  // Connect to production database
  const client = new AxioDBCloud("axiodb://prod.example.com:27019");
  await client.connect();

  const db = await client.createDB("EcommerceDB");
  const products = await db.createCollection("Products");
  const orders = await db.createCollection("Orders");

  // Add new product
  await products.insert({
    sku: "LAPTOP-001",
    name: "Gaming Laptop",
    price: 1299.99,
    stock: 15,
    category: "Electronics"
  });

  // Get low stock products
  const lowStock = await products.query({ stock: { $lt: 10 } })
    .Sort({ stock: 1 })
    .exec();

  console.log("Low stock products:", lowStock.data.documents);

  // Create order
  await orders.insert({
    orderId: "ORD-12345",
    customerId: "USER-001",
    items: [{ sku: "LAPTOP-001", quantity: 1 }],
    total: 1299.99,
    status: "pending"
  });

  // Get today's orders
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = await orders.query({
    createdAt: { $regex: today }
  }).exec();

  console.log("Today's orders:", todayOrders.data.documents.length);

  await client.disconnect();
}

main().catch(console.error);`}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-green-500" />
          Features & Capabilities
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: CheckCircle, title: "35+ Commands", desc: "Full CRUD, aggregation, indexing support" },
            { icon: Lock, title: "Optional Auth (NEW!)", desc: "Shared RBAC with the GUI, per-IP rate limiting" },
            { icon: RefreshCw, title: "Auto-Reconnect", desc: "Exponential backoff with 10 retry attempts" },
            { icon: Activity, title: "Heartbeat", desc: "PING/PONG every 30 seconds" },
            { icon: Network, title: "Connection Pool", desc: "1000+ concurrent connections" },
            { icon: Zap, title: "Fast Protocol", desc: "Binary JSON with 4-byte length prefix" },
            { icon: Shield, title: "TypeScript", desc: "Full type definitions included" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  {feature.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
          Perfect For
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Microservices",
              icon: Server,
              desc: "Share one AxioDB instance across multiple services",
              color: "blue"
            },
            {
              title: "Desktop Apps",
              icon: Package,
              desc: "Electron apps connecting to local or remote database",
              color: "green"
            },
            {
              title: "Cloud Deployments",
              icon: Cloud,
              desc: "Deploy to AWS, Azure, Google Cloud, DigitalOcean",
              color: "purple"
            },
          ].map((useCase, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br from-${useCase.color}-50 to-${useCase.color}-100 dark:from-${useCase.color}-900/20 dark:to-${useCase.color}-800/20 p-6 rounded-xl border border-${useCase.color}-200 dark:border-${useCase.color}-700`}
            >
              <useCase.icon className={`h-12 w-12 text-${useCase.color}-600 dark:text-${useCase.color}-400 mb-4`} />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {useCase.title}
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                {useCase.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-xl">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-6 text-blue-100">
          Deploy AxioDB in minutes and start connecting from anywhere.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/installation"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Installation Guide
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="/api-reference"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            API Reference
            <Code2 className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default AxioDBCloud;
