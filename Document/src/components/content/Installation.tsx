import React from "react";
import {
  PackageOpen,
  Terminal,
  Zap,
  CheckCircle2,
  AlertCircle,
  Command,
  Monitor,
  Download,
  Github,
} from "lucide-react";
import CodeBlock from "../ui/CodeBlock";
import Seo from "../ui/Seo";

const INSTALL_NPM = `npm install axiodb@latest --save`;

const INSTALL_CLI_LINUX = `curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | bash`;

const INSTALL_CLI_WINDOWS = `irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | iex`;

const INSTALL_GUI_LINUX = `curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=2 bash`;

const INSTALL_GUI_WINDOWS = `irm https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.ps1 | CHOICE=2 iex`;

const INSTALL_BOTH = `curl -fsSL https://raw.githubusercontent.com/nexoral/AxioDB/main/cli/Scripts/install.sh | CHOICE=3 bash`;

const Installation: React.FC = () => {
  const installationCode = INSTALL_NPM;

  return (
    <section id="installation" className="pt-12 scroll-mt-20">
      <Seo
        title="Install AxioDB - NPM Package Installation Guide"
        description="Install AxioDB with npm in seconds - replaces SQLite, LowDB, NeDB & raw JSON. Zero native dependencies, no compilation, works on Node.js 20+."
        path="/installation"
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 border border-accent-200 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent-500 rounded-xl shadow-lg animate-glow">
              <PackageOpen className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                Quick Installation
              </h1>
              <p className="text-xl text-gray-600 font-light mt-2">
                Get started in seconds with zero configuration
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            AxioDB is designed for instant deployment. With a single command,
            you'll have access to a powerful, production-ready NoSQL database
            that requires no servers, no complex setup, and no external
            dependencies.
          </p>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-accent-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent-500 rounded-lg shadow-md">
                <span className="text-gray-900 font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Install Package
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Run the npm install command to add AxioDB to your project
              dependencies.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-green-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg shadow-md">
                <span className="text-gray-900 font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Import & Initialize
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Import AxioDB into your project and create your first database
              instance.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-purple-200 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg shadow-md">
                <span className="text-gray-900 font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Start Building
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Begin creating databases, collections, and documents with
              intuitive APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Main Installation Command */}
      <div className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200 hover:border-accent-600">
        <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
              <Terminal className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Package Installation
              </h3>
              <p className="text-gray-600">
                Install AxioDB via npm with the latest version
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
            <CodeBlock code={installationCode} language="bash" />
          </div>

          <div className="bg-accent-50 p-6 rounded-xl border border-accent-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-accent-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-accent-700 mb-2">
                  Prerequisites
                </p>
                <p className="text-sm text-accent-700 leading-relaxed">
                  AxioDB requires{" "}
                  <strong>Node.js version 20.0.0 or higher</strong>. Verify your
                  Node.js version with{" "}
                  <code className="bg-white px-2 py-1 rounded-md text-xs font-mono border border-accent-200">
                    node --version
                  </code>{" "}
                  before installation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLI Installation */}
      <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200 hover:border-emerald-600">
        <div className="absolute inset-0 bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
              <Command className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                AxioDB CLI
              </h3>
              <p className="text-gray-600">
                Command-line tool for managing databases and documents from your terminal
              </p>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            The AxioDB CLI provides a MongoDB-style interactive REPL, 32 TCP commands for
            database management, TLS support, and export/import — available as pre-built
            binaries for 12 platforms.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Linux / macOS</p>
              <CodeBlock code={INSTALL_CLI_LINUX} language="bash" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Windows (PowerShell)</p>
              <CodeBlock code={INSTALL_CLI_WINDOWS} language="powershell" />
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-700 mb-2">
                  Interactive vs Non-Interactive
                </p>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  When run interactively (TTY), the installer presents a menu: 1) CLI, 2) GUI, 3) Both.
                  When piped (<code className="px-1 py-0.5 bg-white rounded text-xs">curl | bash</code>),
                  it defaults to CLI for backward compatibility. To install the GUI non-interactively,
                  set <code className="px-1 py-0.5 bg-white rounded text-xs">CHOICE=2</code> (see below).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GUI Desktop Installation */}
      <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200 hover:border-indigo-600">
        <div className="absolute inset-0 bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                AxioDB Desktop GUI
              </h3>
              <p className="text-gray-600">
                Native desktop application (Electron) — card-based document viewer,
                connection manager, and database tools for Linux, macOS, and Windows
              </p>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            The Desktop GUI bundles the full AxioDB Control Server with a native
            Electron shell — no browser needed. Includes a bouncy-ball splash
            loader, live connection health monitoring, card-based document
            inspection with "Show more" expansion, and native save dialogs.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Linux (.deb / .AppImage)</p>
              <CodeBlock code={INSTALL_GUI_LINUX} language="bash" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Windows (.exe / NSIS)</p>
              <CodeBlock code={INSTALL_GUI_WINDOWS} language="powershell" />
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Download className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-700 mb-2">
                  Or download directly from GitHub Releases
                </p>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Visit{" "}
                  <a
                    href="https://github.com/nexoral/AxioDB/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    GitHub Releases
                  </a>
                  {" "}and download the installer for your platform:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-indigo-700">
                  <li>• <strong>Linux</strong>: <code className="px-1.5 py-0.5 bg-white rounded text-xs">axiodb-desktop_&lt;version&gt;_amd64.deb</code> or <code className="px-1.5 py-0.5 bg-white rounded text-xs">.AppImage</code></li>
                  <li>• <strong>Windows</strong>: <code className="px-1.5 py-0.5 bg-white rounded text-xs">AxioDB-Setup-&lt;version&gt;.exe</code></li>
                  <li>• <strong>macOS</strong>: <code className="px-1.5 py-0.5 bg-white rounded text-xs">axiodb-desktop-&lt;version&gt;-mac.zip</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install Both CLI & GUI */}
      <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200 hover:border-amber-600">
        <div className="absolute inset-0 bg-amber-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
              <Github className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Install Both CLI &amp; GUI
              </h3>
              <p className="text-gray-600">One command for everything</p>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            Use <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">CHOICE=3</code> to install
            both the AxioDB CLI and the Desktop GUI in a single run. The installer will prompt
            interactively when run in a terminal, or run non-interactively when piped.
          </p>

          <CodeBlock code={INSTALL_BOTH} language="bash" />
        </div>
      </div>

      {/* System Requirements */}
      <div className="group relative bg-white rounded-lg shadow-lg hover:shadow-md transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200">
        <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                System Requirements
              </h3>
              <p className="text-gray-600">
                Minimal requirements for maximum compatibility
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <strong className="text-gray-900 text-lg">
                  Node.js Runtime
                </strong>
              </div>
              <p className="text-gray-600">
                v20.0.0 or higher recommended
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
                <strong className="text-gray-900 text-lg">
                  Operating System
                </strong>
              </div>
              <p className="text-gray-600">
                Cross-platform (Windows, macOS, Linux)
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <strong className="text-gray-900 text-lg">
                  Disk Space
                </strong>
              </div>
              <p className="text-gray-600">
                Minimal footprint (~2MB package size)
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <strong className="text-gray-900 text-lg">
                  Dependencies
                </strong>
              </div>
              <p className="text-gray-600">
                Zero external dependencies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Use Banner */}
      <div className="relative overflow-hidden bg-green-50 rounded-lg p-8 lg:p-10 border-l-4 border-green-500 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-100/40 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-green-700 mb-3">
              Ready to Use Immediately
            </h4>
            <p className="text-lg text-green-700 leading-relaxed">
              AxioDB works out of the box with zero configuration required. No
              database servers, no complex setup processes, no additional
              dependencies to manage. Simply install and start building your
              application with enterprise-grade database capabilities!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Installation;
