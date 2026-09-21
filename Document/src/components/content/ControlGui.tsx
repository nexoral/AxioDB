import {
  ArrowRight,
  Monitor,
  Download,
  Terminal,
  Shield,
  Zap,
  Server,
  Database,
  HardDrive,
  Activity,
  Layers,
  FolderTree,
  Lock,
  RefreshCw,
  CheckCircle2,
  FileText,
} from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const INSTALL_GUI_LINUX = `curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash`;

const INSTALL_GUI_WINDOWS = `irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | CHOICE=2 iex`;

const MANUAL_DEB = `# Install on Debian / Ubuntu / Mint
sudo dpkg -i axiodb-control_22.11.0_amd64.deb

# Launch AxioDB Control
axiodb-control`;

const MANUAL_APPIMAGE = `# Make AppImage executable and launch
chmod +x axiodb-control-22.11.0.AppImage
./axiodb-control-22.11.0.AppImage`;

const LOCAL_STORAGE_CODE = `// Inside Electron Main Process (main.cts):
import { AxioDB } from "axiodb";
import { app } from "electron";
import path from "path";

// AxioDB Control stores its own connection profiles & settings locally
const dbPath = path.join(app.getPath("userData"), ".axiodb-control");
const localDB = new AxioDB({
  RootPath: dbPath,
  RootName: ".axiodb-control",
  InMemoryCache: true,
});

await localDB.init();`;

const SERVER_CONFIG_CODE = `import { AxioDB } from "axiodb";

// Enable HTTP Control API (default port 27018) for AxioDB Control GUI
const db = new AxioDB({
  GUI: true,             // Starts HTTP server on port 27018
  Port: 27018,           // Default HTTP port
  Auth: true,            // Enable RBAC authentication
  AdminUser: "admin",    // Default admin username
  AdminPassword: "your-secure-password",
});

await db.init();`;

const ControlGui: React.FC = () => {
  const heroReveal = useScrollReveal<HTMLDivElement>();
  const installReveal = useScrollReveal<HTMLDivElement>();
  const architectureReveal = useScrollReveal<HTMLDivElement>();
  const featuresReveal = useScrollReveal<HTMLDivElement>();
  const storageReveal = useScrollReveal<HTMLDivElement>();
  const platformsReveal = useScrollReveal<HTMLDivElement>();

  return (
    <section id="gui" className="scroll-mt-20">
      <Seo
        title="AxioDB Control GUI - Desktop Database Manager"
        description="AxioDB Control is the official desktop GUI for AxioDB. Built with Electron, featuring connection management, card-based document browsing, live health monitoring, query console, and binary backups."
        path="/gui"
      />

      {/* Hero */}
      <div
        ref={heroReveal.ref}
        className={`relative overflow-hidden bg-white rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-gray-200 shadow-md reveal-on-scroll ${heroReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-full font-bold">
                NEW
              </span>
              <span>AxioDB Control</span>
              <span>•</span>
              <span>Linux · macOS · Windows</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
            AxioDB Control GUI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 max-w-3xl">
            The official cross-platform desktop application for AxioDB. Connect to
            local and remote databases, inspect collections with card-based document
            views, monitor live latency, run MongoDB-style queries, and stream database backups.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-200">
              <Monitor className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">Electron Native Shell</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Embedded AxioDB Storage</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">10s Live Health Ping</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
              <Layers className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Card Document Viewer</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <Download className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Binary tar.gz Export</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/nexoral/AxioDB/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg transition-all"
            >
              <Download className="h-5 w-5" />
              Download Installer
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/nexoral/AxioDB/tree/main/electron"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              <FolderTree className="h-5 w-5" />
              Electron Source
            </a>
          </div>
        </div>
      </div>

      {/* Server Requirement Notice */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-lg mb-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Server className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900">
              Connects to AxioDB HTTP Control Server (Port 27018)
            </p>
            <p className="text-sm text-indigo-800 mt-1 leading-relaxed">
              AxioDB Control operates over the HTTP Control API on port <code className="px-1.5 py-0.5 bg-white rounded font-mono text-xs">27018</code>.
              Ensure your server instance has <code className="px-1.5 py-0.5 bg-white rounded font-mono text-xs">GUI: true</code> (or environment variable <code className="px-1.5 py-0.5 bg-white rounded font-mono text-xs">AXIODB_GUI=true</code>) enabled.
              If RBAC authentication is activated, log in with your administrative or role credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Installation */}
      <div
        ref={installReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${installReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Installation</h2>
        <p className="text-gray-600 mb-6">
          Install AxioDB Control directly using the universal installer script with <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs font-semibold">CHOICE=2</code>,
          or download the pre-built installer for your operating system.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-gray-700" />
              <p className="text-sm font-semibold text-gray-800">Linux / macOS (One-Line Script)</p>
            </div>
            <CodeBlock code={INSTALL_GUI_LINUX} language="bash" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-gray-700" />
              <p className="text-sm font-semibold text-gray-800">Windows (PowerShell)</p>
            </div>
            <CodeBlock code={INSTALL_GUI_WINDOWS} language="powershell" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Manual Debian / Ubuntu (.deb)</p>
            <CodeBlock code={MANUAL_DEB} language="bash" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Manual Standalone AppImage (.AppImage)</p>
            <CodeBlock code={MANUAL_APPIMAGE} language="bash" />
          </div>
        </div>

        {/* Release Artifacts Matrix */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Download className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Direct GitHub Releases Downloads</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download the binary directly from{" "}
            <a
              href="https://github.com/nexoral/AxioDB/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline font-medium"
            >
              GitHub Releases
            </a>:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-700">
                  <th className="py-2 px-3 font-semibold">Platform</th>
                  <th className="py-2 px-3 font-semibold">Format</th>
                  <th className="py-2 px-3 font-semibold">Artifact Filename</th>
                  <th className="py-2 px-3 font-semibold">Architecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-gray-800">Linux (Debian / Ubuntu)</td>
                  <td className="py-2.5 px-3 text-gray-600">.deb package</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">axiodb-control_&lt;version&gt;_amd64.deb</td>
                  <td className="py-2.5 px-3 text-gray-600">x64, arm64</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-gray-800">Linux (Universal)</td>
                  <td className="py-2.5 px-3 text-gray-600">.AppImage</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">axiodb-control-&lt;version&gt;.AppImage</td>
                  <td className="py-2.5 px-3 text-gray-600">x64, arm64</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-gray-800">Windows (10 / 11)</td>
                  <td className="py-2.5 px-3 text-gray-600">NSIS Installer (.exe)</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">AxioDB-Control-Setup-&lt;version&gt;.exe</td>
                  <td className="py-2.5 px-3 text-gray-600">x64</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-gray-800">macOS</td>
                  <td className="py-2.5 px-3 text-gray-600">App Bundle (.zip)</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">AxioDB.Control-&lt;version&gt;.zip</td>
                  <td className="py-2.5 px-3 text-gray-600">Intel &amp; Apple Silicon</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Local Storage Architecture */}
      <div
        ref={storageReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${storageReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <HardDrive className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Local Storage Architecture
            </h2>
            <p className="text-sm text-gray-600">
              Powered by AxioDB itself — pure embedded NoSQL storage without SQLite or native bindings
            </p>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed mb-6">
          AxioDB Control uses an embedded instance of <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs">axiodb</code> inside
          its Electron main process to store saved server connection profiles, user preferences,
          and UI states. Data is organized into append-only JSONL files with dual-write in-memory caching.
        </p>

        <div className="mb-6">
          <CodeBlock code={LOCAL_STORAGE_CODE} language="typescript" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-3">On-Disk Storage Locations</h3>
        <p className="text-sm text-gray-600 mb-4">
          All connection profiles and settings are stored locally on your machine in the standard Electron user data directory:
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-700">
                <th className="py-2 px-3 font-semibold">Operating System</th>
                <th className="py-2 px-3 font-semibold">Local AxioDB Data Path</th>
                <th className="py-2 px-3 font-semibold">Managed Collections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-gray-800">Linux</td>
                <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">~/.config/AxioDB Control/.axiodb-control/AppData/</td>
                <td className="py-2.5 px-3 text-gray-600">connections, settings</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-gray-800">Windows</td>
                <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">%APPDATA%\AxioDB Control\.axiodb-control\AppData\</td>
                <td className="py-2.5 px-3 text-gray-600">connections, settings</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-gray-800">macOS</td>
                <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">~/Library/Application Support/AxioDB Control/.axiodb-control/AppData/</td>
                <td className="py-2.5 px-3 text-gray-600">connections, settings</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Secure Credential Persistence</p>
          </div>
          <p className="text-xs text-emerald-700">
            Connection passwords and tokens are preserved safely within your operating system user directory.
            Profiles are deduplicated by <code className="px-1 py-0.5 bg-white rounded font-mono">host:port:username</code>,
            and password auto-fill triggers automatically when selecting a saved connection profile.
          </p>
        </div>
      </div>

      {/* Features & Capabilities */}
      <div
        ref={featuresReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${featuresReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-500 rounded-lg text-white">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Connection Hub &amp; Auto-Fill</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Manage multiple AxioDB server profiles across staging, development, and production.
              Select any profile to auto-populate the endpoint, port, username, and saved credentials.
              Cards feature visual &quot;Password saved&quot; badges and instant connection testing.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Live Health &amp; Latency Ping</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              AxioDB Control executes an automatic 10-second background heartbeat to <code className="px-1 py-0.5 bg-white rounded text-xs">/api/health</code>.
              Roundtrip latency (ms) is updated live in the titlebar and status bar with a pulsing green connection status indicator.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500 rounded-lg text-white">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Card-Based Document Explorer</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every document is displayed as an individual card with <code className="px-1 py-0.5 bg-white rounded text-xs">#documentId</code> header,
              structured field previews for the first 10 fields, and a &quot;Show more&quot; toggle to view large documents.
              Quick hover actions allow immediate Copy, Edit, and Delete.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500 rounded-lg text-white">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Binary Database Export &amp; Backup</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Right-click any database in the sidebar to initiate a binary <code className="px-1 py-0.5 bg-white rounded text-xs">.tar.gz</code> archive
              export. The app streams the compressed backup directly from the HTTP API to native system save dialogs with real-time spinner indicators.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Visual Query Console</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Run MongoDB-style JSON queries with operators like <code className="px-1 py-0.5 bg-white rounded text-xs">$gt</code>,
              <code className="px-1 py-0.5 bg-white rounded text-xs">$regex</code>, and <code className="px-1 py-0.5 bg-white rounded text-xs">$in</code>.
              Inspect matching documents, analyze query timings, and paginate results without external tooling.
            </p>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-pink-500 rounded-lg text-white">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Bouncy-Ball Splash Screen</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Eliminates the initial white-flash typical in desktop Electron applications.
              A smooth bouncy-balls loader initializes the window seamlessly before presenting the dashboard interface.
            </p>
          </div>
        </div>
      </div>

      {/* Server Configuration */}
      <div
        ref={architectureReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${architectureReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuring the Server for GUI Access</h2>
        <p className="text-gray-600 mb-4">
          To enable AxioDB Control GUI to connect to your AxioDB node, start the HTTP Control API by setting <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs font-semibold">GUI: true</code>:
        </p>

        <div className="mb-6">
          <CodeBlock code={SERVER_CONFIG_CODE} language="typescript" />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">CLI / Environment Variable Flag:</p>
          <p className="text-sm text-gray-600">
            You can also activate the HTTP Control API via environment variables when running in Docker or systemd:
          </p>
          <div className="mt-2">
            <code className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-mono text-indigo-700">
              AXIODB_GUI=true AXIODB_AUTH=true AXIODB_ADMIN_USER=admin AXIODB_ADMIN_PASS=secret node server.js
            </code>
          </div>
        </div>
      </div>

      {/* Supported Platforms */}
      <div
        ref={platformsReveal.ref}
        className={`bg-white rounded-lg p-5 sm:p-8 lg:p-8 mb-8 border border-gray-200 shadow-md reveal-on-scroll ${platformsReveal.isVisible ? "is-visible" : ""}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported Platforms</h2>
        <p className="text-gray-600 mb-4">
          AxioDB Control is compiled natively for modern 64-bit desktop operating systems:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-700">
                <th className="py-2 px-3 font-semibold">Operating System</th>
                <th className="py-2 px-3 font-semibold">Supported Versions</th>
                <th className="py-2 px-3 font-semibold">Architectures</th>
                <th className="py-2 px-3 font-semibold">Distribution Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-gray-800">Linux</td>
                <td className="py-2.5 px-3 text-gray-600">Ubuntu 20.04+, Debian 11+, Fedora, Arch</td>
                <td className="py-2.5 px-3 text-gray-600">x86_64 (amd64), aarch64 (arm64)</td>
                <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">.deb, .AppImage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-gray-800">Windows</td>
                <td className="py-2.5 px-3 text-gray-600">Windows 10, Windows 11, Windows Server 2019+</td>
                <td className="py-2.5 px-3 text-gray-600">x86_64 (amd64)</td>
                <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">NSIS Installer (.exe)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-gray-800">macOS</td>
                <td className="py-2.5 px-3 text-gray-600">macOS 12 Monterey or later</td>
                <td className="py-2.5 px-3 text-gray-600">Intel (x64) &amp; Apple Silicon (M1/M2/M3/M4)</td>
                <td className="py-2.5 px-3 font-mono text-xs text-indigo-700">Zip (.zip bundle)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ControlGui;
