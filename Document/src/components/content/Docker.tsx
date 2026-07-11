import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import {
  Package,
  Settings,
  HardDrive,
  Layers,
  GitBranch,
  ExternalLink,
  ArrowRight,
  Code2,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";

const Docker: React.FC = () => {
  return (
    <div className="space-y-12">
      <Seo
        title="Docker Deployment | AxioDB Documentation"
        description="Run AxioDB in Docker - simple docker run quick start, then advanced env vars, volumes, and Docker Compose configuration."
        path="/docker"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-sky-900/20 dark:via-slate-800 dark:to-blue-900/20 rounded-2xl p-8 lg:p-12 border border-sky-200 dark:border-sky-700 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 rounded-full border border-sky-300 dark:border-sky-600 mb-6">
            <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <span className="text-sky-700 dark:text-sky-300 font-semibold">
              DEPLOYMENT
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Docker Deployment
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Run AxioDB's GUI and TCP server (AxioDBCloud) in a container with one command, then
            tune it with environment variables when you need volumes, custom ports, or to turn
            authentication on or off — no rebuild required.
          </p>
        </div>
      </section>

      {/* Simple */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Package className="h-8 w-8 text-sky-500" />
          Simple: Run the Container
        </h2>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <CodeBlock
            language="bash"
            code={`docker run -d \\
  --name axiodb-server \\
  -p 27018:27018 \\
  -p 27019:27019 \\
  -e AXIODB_TCP_AUTH=true \\
  -v axiodb-data:/app \\
  theankansaha/axiodb

# Ports:
# 27018 - HTTP GUI Dashboard
# 27019 - TCP Remote Access (AxioDBCloud)
# Volume: /app is the main data directory`}
          />

          <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700">
            <p className="text-sm text-sky-800 dark:text-sky-200">
              TCP authentication is on by default in this image. Log into the GUI at{" "}
              <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">http://localhost:27018</code>{" "}
              as <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">admin</code>/
              <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">admin</code> to complete the
              forced password change before connecting over TCP — see{" "}
              <a href="/troubleshooting" className="underline font-medium">Troubleshooting</a> if you skip this step.
            </p>
          </div>
        </div>
      </section>

      {/* Advanced */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-500" />
          Advanced: Environment Variables, Volumes, Compose
        </h2>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Environment Variables
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Every option below has a default matching the image's previous fixed behavior —
              override any of them with <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">-e VAR=value</code> at
              <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded ml-1">docker run</code> time, no rebuild required.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-4 font-semibold text-slate-900 dark:text-white">Variable</th>
                    <th className="py-2 pr-4 font-semibold text-slate-900 dark:text-white">Default</th>
                    <th className="py-2 font-semibold text-slate-900 dark:text-white">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_GUI</td>
                    <td className="py-2 pr-4"><code>true</code></td>
                    <td className="py-2">Enable the HTTP Control Server / web GUI on port 27018</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_TCP</td>
                    <td className="py-2 pr-4"><code>true</code></td>
                    <td className="py-2">Enable the AxioDBCloud TCP server on port 27019</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_TCP_AUTH</td>
                    <td className="py-2 pr-4"><code>true</code></td>
                    <td className="py-2">Require username/password on TCP connections (same RBAC accounts as the GUI)</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_TLS</td>
                    <td className="py-2 pr-4"><code>false</code></td>
                    <td className="py-2">Encrypt TCP connections with TLS instead of plaintext (see below)</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_TLS_CERT_PATH</td>
                    <td className="py-2 pr-4">-</td>
                    <td className="py-2">Path <em>inside the container</em> to a PEM cert file - required when TLS is on</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_TLS_KEY_PATH</td>
                    <td className="py-2 pr-4">-</td>
                    <td className="py-2">Path <em>inside the container</em> to the matching private key - required when TLS is on</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_ROOT_NAME</td>
                    <td className="py-2 pr-4"><code>AxioDB</code></td>
                    <td className="py-2">Name of the root database folder created under the data volume</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">AXIODB_CUSTOM_PATH</td>
                    <td className="py-2 pr-4">container cwd</td>
                    <td className="py-2">Custom path for database storage inside the container</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              Ports themselves (27018/27019) aren't configurable via environment variable — remap them at the
              Docker layer with <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">-p &lt;host-port&gt;:27018</code> /
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded ml-1">-p &lt;host-port&gt;:27019</code>.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <ShieldOff className="h-6 w-6 text-amber-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Disabling TCP Authentication
              </h3>
            </div>
            <CodeBlock
              language="bash"
              code={`# Only do this on a trusted private network, or with AXIODB_TLS=true (see below) -
# with auth off and no TLS, any client that can reach port 27019 has full database access
# and traffic is readable by anyone on the network.
docker run -d \\
  --name axiodb-server \\
  -p 27018:27018 \\
  -p 27019:27019 \\
  -e AXIODB_TCP_AUTH=false \\
  -v axiodb-data:/app \\
  theankansaha/axiodb`}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Enabling TLS
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The TCP protocol is plaintext by default. To encrypt it, you need your own cert +
              key (AxioDB never generates one for you) mounted into the container - the cert/key
              env vars must point at the path <em>inside the container</em>, not on your real
              machine:
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              The rule: <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">AXIODB_TLS_CERT_PATH</code>{" "}
              must match the <em>right-hand side</em> of the{" "}
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">-v</code> mount
              (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">/certs/...</code>),
              never your real machine&apos;s path - the container only sees what you&apos;ve
              explicitly mounted into it. See the{" "}
              <a href="/cloud#advanced-tls-encryption" className="text-blue-600 dark:text-blue-400 hover:underline">AxioDBCloud TLS guide</a>{" "}
              for how to generate a cert and configure the client to match.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Data Persistence
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Mount a volume at <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">/app</code> so
              your data survives container restarts and recreation:
            </p>
            <CodeBlock
              language="bash"
              code={`docker run -d \\
  --name axiodb-server \\
  -p 27018:27018 \\
  -p 27019:27019 \\
  -v "$(pwd)/axiodb-data":/app \\
  theankansaha/axiodb`}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="h-6 w-6 text-indigo-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Docker Compose
              </h3>
            </div>
            <CodeBlock
              language="yaml"
              code={`version: "3.8"

services:
  axiodb:
    image: theankansaha/axiodb
    container_name: axiodb-server
    ports:
      - "27018:27018"
      - "27019:27019"
    environment:
      - AXIODB_GUI=true
      - AXIODB_TCP=true
      - AXIODB_TCP_AUTH=true
      - AXIODB_ROOT_NAME=AxioDB
    volumes:
      - axiodb-data:/app
    restart: unless-stopped

volumes:
  axiodb-data:`}
            />
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              With TLS enabled, note the two different kinds of entry under{" "}
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">volumes:</code> below
              - <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">./mycerts:/certs:ro</code> is
              your real folder (it contains a <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">/</code>),
              mounted read-only; <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">axiodb-data:/app</code> is
              a Docker-managed named volume (no <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">/</code>,
              just a label):
            </p>
            <CodeBlock
              language="yaml"
              code={`version: "3.8"

services:
  axiodb:
    image: theankansaha/axiodb
    container_name: axiodb-server
    ports:
      - "27018:27018"
      - "27019:27019"
    environment:
      - AXIODB_GUI=true
      - AXIODB_TCP=true
      - AXIODB_TCP_AUTH=true
      - AXIODB_TLS=true
      - AXIODB_TLS_CERT_PATH=/certs/cert.pem
      - AXIODB_TLS_KEY_PATH=/certs/key.pem
      - AXIODB_ROOT_NAME=AxioDB
    volumes:
      - ./mycerts:/certs:ro      # your real cert.pem/key.pem folder -> /certs in the container
      - axiodb-data:/app         # Docker-managed volume for database files
    restart: unless-stopped

volumes:
  axiodb-data:`}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <GitBranch className="h-6 w-6 text-slate-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Building From Source &amp; Full Troubleshooting
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Instructions for building the image yourself, plus a deeper Docker-specific
              troubleshooting guide (container won't start, port conflicts, data-persistence
              checks), live in the repository's{" "}
              <a
                href="https://github.com/nexoral/AxioDB/blob/main/Docker/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 underline font-medium"
              >
                Docker/README.md <ExternalLink className="h-3.5 w-3.5" />
              </a>{" "}
              — the canonical Docker doc, not duplicated here. For general connection/auth
              troubleshooting, see the <a href="/troubleshooting" className="underline font-medium">Troubleshooting</a> page.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-8 rounded-xl">
        <h2 className="text-3xl font-bold mb-4">Connect to Your Container</h2>
        <p className="text-xl mb-6 text-sky-100">
          Once the container is running, connect to it with AxioDBCloud.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/cloud"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sky-600 rounded-lg font-semibold hover:bg-sky-50 transition-colors"
          >
            AxioDBCloud Guide
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="/troubleshooting"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Troubleshooting
            <Code2 className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default Docker;
