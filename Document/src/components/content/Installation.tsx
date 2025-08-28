import React from "react";
import { PackageOpen, Terminal, Download, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import CodeBlock from "../ui/CodeBlock";

const Installation: React.FC = () => {
  const installationCode = `npm install axiodb@latest --save`;

  return (
    <section id="installation" className="pt-12 scroll-mt-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-blue-200 dark:border-blue-800 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg animate-glow">
              <PackageOpen className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 dark:from-blue-200 dark:via-indigo-300 dark:to-purple-200 bg-clip-text text-transparent">
                Quick Installation
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                Get started in seconds with zero configuration
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            AxioDB is designed for instant deployment. With a single command, you'll have access to a powerful, 
            production-ready NoSQL database that requires no servers, no complex setup, and no external dependencies.
          </p>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Install Package</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Run the npm install command to add AxioDB to your project dependencies.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Import & Initialize</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Import AxioDB into your project and create your first database instance.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Start Building</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Begin creating databases, collections, and documents with intuitive APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Main Installation Command */}
      <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 mb-12 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/5 dark:to-indigo-900/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <Terminal className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Package Installation</h3>
              <p className="text-slate-600 dark:text-slate-300">Install AxioDB via npm with the latest version</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-xl p-6 mb-6 shadow-inner">
            <CodeBlock code={installationCode} language="bash" />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Prerequisites</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  AxioDB requires <strong>Node.js version 12.0.0 or higher</strong>. 
                  Verify your Node.js version with{" "}
                  <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-mono border border-blue-200 dark:border-blue-800">
                    node --version
                  </code>{" "}
                  before installation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Requirements */}
      <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 lg:p-10 mb-12 border border-slate-200 dark:border-slate-700">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Requirements</h3>
              <p className="text-slate-600 dark:text-slate-300">Minimal requirements for maximum compatibility</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <strong className="text-slate-800 dark:text-slate-100 text-lg">Node.js Runtime</strong>
              </div>
              <p className="text-slate-600 dark:text-slate-400">v12.0.0 or higher recommended</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <strong className="text-slate-800 dark:text-slate-100 text-lg">Operating System</strong>
              </div>
              <p className="text-slate-600 dark:text-slate-400">Cross-platform (Windows, macOS, Linux)</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <strong className="text-slate-800 dark:text-slate-100 text-lg">Disk Space</strong>
              </div>
              <p className="text-slate-600 dark:text-slate-400">Minimal footprint (~2MB package size)</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <strong className="text-slate-800 dark:text-slate-100 text-lg">Dependencies</strong>
              </div>
              <p className="text-slate-600 dark:text-slate-400">Zero external dependencies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Use Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-8 lg:p-10 border-l-4 border-green-500 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-3">Ready to Use Immediately</h4>
            <p className="text-lg text-green-800 dark:text-green-200 leading-relaxed">
              AxioDB works out of the box with zero configuration required. No database servers, 
              no complex setup processes, no additional dependencies to manage. 
              Simply install and start building your application with enterprise-grade database capabilities!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Installation;
