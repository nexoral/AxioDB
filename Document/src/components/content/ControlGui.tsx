import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Monitor,
  Play,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const INSTALL_GUI_LINUX =
  "curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash";

const INSTALL_GUI_WINDOWS =
  "$env:CHOICE=2; irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex";

const SERVER_GUI_CONFIG_CODE = `import { AxioDB } from "axiodb";

// Starts the web GUI and the HTTP API on port 27018.
const db = new AxioDB({ GUI: true });

// Use db.createDB(), db.getDB(), or another database operation here.
// AxioDB waits for its startup work before handling that operation.`;

const SERVER_HTTP_CONFIG_CODE = `import { AxioDB } from "axiodb";

// Starts the HTTP API on port 27018 without serving the web GUI.
const db = new AxioDB({ GUI: false, HTTP: true });`;

const ENVIRONMENT_CONFIG_CODE =
  "docker run -d -p 27018:27018 \\\n  -e AXIODB_GUI=true -e AXIODB_HTTP=true \\\n  theankansaha/axiodb";

const ControlGui: React.FC = () => {
  const heroReveal = useScrollReveal<HTMLDivElement>();
  const quickStartReveal = useScrollReveal<HTMLDivElement>();
  const featuresReveal = useScrollReveal<HTMLDivElement>();
  const helpReveal = useScrollReveal<HTMLDivElement>();

  return (
    <section id="gui" className="scroll-mt-20">
      <Seo
        title="AxioDB Control GUI - Desktop Database Manager"
        description="Learn how to install AxioDB Control, connect it to an AxioDB server, and manage your data from a desktop app."
        path="/gui"
      />

      <div
        ref={heroReveal.ref}
        className={`relative overflow-hidden bg-white rounded-lg p-5 sm:p-8 lg:p-12 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${heroReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Monitor className="h-7 w-7 text-white" />
            </div>
            <span className="text-sm font-semibold text-indigo-700">
              Desktop app · Windows · macOS · Linux
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            AxioDB Control
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            A simple desktop way to connect to AxioDB, browse your collections,
            run queries, and manage documents. Follow the three steps below to
            get started.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/nexoral/AxioDB/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download the app
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="#quick-start"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Quick start
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 mb-8">
        <div className="flex items-start gap-3">
          <Server className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold text-indigo-900 mb-1">
              One important thing to know
            </h2>
            <p className="text-sm text-indigo-800 leading-relaxed">
              AxioDB Control is the{" "}
              <strong>client application</strong>. It connects to an AxioDB
              server that is already running. The server must expose the HTTP
              Control API on port <code className="font-mono">27018</code>.
            </p>
          </div>
        </div>
      </div>

      <div
        ref={quickStartReveal.ref}
        id="quick-start"
        className={`bg-white rounded-lg p-5 sm:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${quickStartReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-600 mb-2">
            Quick start
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Get connected in three steps
          </h2>
          <p className="text-gray-600">
            Start with the normal path. You can find platform details and
            alternate commands further down this page.
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid md:grid-cols-[auto_1fr] gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Install AxioDB Control
              </h3>
              <p className="text-gray-600 mb-4">
                Download the installer for your computer from{" "}
                <a
                  href="https://github.com/nexoral/AxioDB/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  GitHub Releases
                </a>
                . Open the downloaded file and follow the installer steps.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="font-semibold text-gray-900">Windows</p>
                  <p className="text-gray-600 mt-1">NSIS installer (.exe)</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="font-semibold text-gray-900">macOS</p>
                  <p className="text-gray-600 mt-1">App bundle (.zip)</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="font-semibold text-gray-900">Linux</p>
                  <p className="text-gray-600 mt-1">.deb or AppImage</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-[auto_1fr] gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Start the HTTP server
              </h3>
              <p className="text-gray-600 mb-4">
                Choose the mode you need. The HTTP server always uses port{" "}
                <code className="font-mono">27018</code>; there is no
                <code className="font-mono">Port</code> option in
                <code className="font-mono">AxioDB</code>.
              </p>
              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    GUI + HTTP API
                  </p>
                  <CodeBlock
                    code={SERVER_GUI_CONFIG_CODE}
                    language="typescript"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    HTTP API only
                  </p>
                  <CodeBlock
                    code={SERVER_HTTP_CONFIG_CODE}
                    language="typescript"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 space-y-2">
                <p>
                  <strong className="text-gray-900">GUI: true</strong> enables
                  both the browser dashboard and the HTTP API.
                </p>
                <p>
                  <strong className="text-gray-900">
                    HTTP: true, GUI: false
                  </strong>{" "}
                  enables the HTTP API for another client or application
                  without serving the dashboard.
                </p>
                <p>
                  The server listens on{" "}
                  <code className="font-mono">0.0.0.0:27018</code>, so another
                  machine can reach it using the server&apos;s IP address if
                  the network firewall allows it. The built-in authentication
                  still protects API actions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-[auto_1fr] gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Add the server in the app
              </h3>
              <p className="text-gray-600 mb-4">
                Open AxioDB Control, create a connection, and enter:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Host
                  </p>
                  <p className="font-mono text-gray-900 mt-1">
                    localhost (or server IP)
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Port
                  </p>
                  <p className="font-mono text-gray-900 mt-1">27018</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Login
                  </p>
                  <p className="text-gray-900 mt-1">
                    <code className="font-mono">admin</code> /{" "}
                    <code className="font-mono">admin</code> first time
                  </p>
                </div>
              </div>
              <p className="flex items-start gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                Click <strong>Test connection</strong>, then select the
                database you want to work with.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={featuresReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${featuresReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-600 mb-2">
            After you connect
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What can you do?
          </h2>
          <p className="text-gray-600">
            The main workspace is designed around the tasks you do most often.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <Database className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">Browse your data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Open databases and collections, then view documents in an easy
                card layout.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <FileText className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">Run queries</h3>
              <p className="text-sm text-gray-600 mt-1">
                Filter documents with JSON queries and inspect the results
                without using a terminal.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <Play className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">Edit documents</h3>
              <p className="text-sm text-gray-600 mt-1">
                Copy, edit, or delete documents directly from the document
                viewer.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <Download className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">Create backups</h3>
              <p className="text-sm text-gray-600 mt-1">
                Export a database as a <code className="font-mono">.tar.gz</code>{" "}
                archive from the database menu.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4 sm:col-span-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">See connection health</h3>
              <p className="text-sm text-gray-600 mt-1">
                The app checks the server regularly and shows connection
                status and latency while you work.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold text-amber-900 mb-1">
              Keep your server safe
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed">
              Do not expose port <code className="font-mono">27018</code> to
              the public internet without proper network protection. Use
              authentication, a firewall, and a private network or VPN for
              remote connections.
            </p>
          </div>
        </div>
      </div>

      <div
        ref={helpReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 border border-gray-200 shadow-md reveal-on-scroll ${helpReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="flex items-start gap-3 mb-6">
          <HelpCircle className="h-6 w-6 text-indigo-600 mt-0.5" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Need a different setup?
            </h2>
            <p className="text-gray-600 mt-1">
              Keep the beginner path above as your reference. These sections
              cover less common setups and implementation details.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <details className="group rounded-lg border border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-gray-900">
              Install with a command
              <ChevronRight className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-2">
                Use these commands when you prefer a terminal or are setting up
                a machine remotely.
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Linux / macOS
              </p>
              <CodeBlock code={INSTALL_GUI_LINUX} language="bash" />
              <p className="text-sm font-semibold text-gray-800 mb-1 mt-4">
                Windows PowerShell
              </p>
              <CodeBlock code={INSTALL_GUI_WINDOWS} language="powershell" />
            </div>
          </details>

          <details className="group rounded-lg border border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-gray-900">
              Configure with environment variables
              <ChevronRight className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-2">
                This Docker example starts both the web GUI and HTTP API. The
                AxioDB Docker runner reads these environment variables.
              </p>
              <CodeBlock code={ENVIRONMENT_CONFIG_CODE} language="bash" />
              <p className="text-sm text-gray-500 mt-3">
                For HTTP-only Docker mode, use{" "}
                <code className="font-mono">AXIODB_GUI=false</code> with{" "}
                <code className="font-mono">AXIODB_HTTP=true</code> for
                instead. When using the built-in HTTP server directly from
                Node.js, set <code className="font-mono">GUI</code> and{" "}
                <code className="font-mono">HTTP</code> in the
                <code className="font-mono">AxioDB</code> options object.
                The default seeded login is{" "}
                <code className="font-mono">admin/admin</code>; change it
                immediately after the first login.
              </p>
            </div>
          </details>

          <details className="group rounded-lg border border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-gray-900">
              Supported versions and local settings
              <ChevronRight className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-gray-200 p-4 text-sm text-gray-600 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Supported desktop systems
                </h3>
                <p>
                  Linux (Ubuntu 20.04+, Debian 11+, Fedora, and Arch), Windows
                  10/11 and Windows Server 2019+, and macOS 12 Monterey or
                  later. Linux supports x86_64 and arm64; Windows supports
                  x86_64; macOS supports Intel and Apple Silicon.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Where connection profiles are saved
                </h3>
                <p>
                  AxioDB Control stores connection profiles and preferences in
                  Electron&apos;s local user-data directory. They are kept on
                  the computer running the GUI and are not stored in your
                  AxioDB database.
                </p>
              </div>
            </div>
          </details>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <a
            href="/troubleshooting"
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline font-semibold"
          >
            Troubleshooting
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/server-api"
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline font-semibold"
          >
            HTTP Control API reference
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/installation"
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline font-semibold"
          >
            AxioDB installation
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/nexoral/AxioDB/tree/main/electron"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline font-semibold"
          >
            Electron source
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <Terminal className="inline h-4 w-4 mr-1" />
        Prefer the terminal? See the{" "}
        <a href="/cli" className="text-indigo-600 hover:underline font-semibold">
          AxioDB CLI guide
        </a>
        .
      </div>
    </section>
  );
};

export default ControlGui;
