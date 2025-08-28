import React from "react";
import {
  Database,
  Zap,
  Shield,
  Code,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Download,
} from "lucide-react";
import PainPoints from "./PainPoints";

const Introduction: React.FC = () => {
  return (
    <section id="introduction" className="scroll-mt-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 rounded-2xl p-8 lg:p-12 mb-12 border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 animate-slide-in-right">
            <div className="p-2 bg-blue-600 rounded-lg animate-glow">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>Production Ready</span>
              <span>•</span>
              <Users className="h-4 w-4 text-green-500" />
              <span>Developer Friendly</span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl xl:text-8xl font-extrabold mb-8 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight tracking-tight">
            AxioDB
          </h1>
          <div className="space-y-4 mb-10">
            <p className="text-2xl lg:text-3xl xl:text-4xl text-slate-700 dark:text-slate-200 font-medium leading-tight">
              Production-Ready Caching Database
            </p>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-4xl">
              The ultimate caching solution for production environments,
              engineered with intelligent memory management, lightning-fast data
              retrieval, and seamless integration designed specifically for
              modern web applications, APIs, and frontend frameworks.
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <img
              src="https://badge.fury.io/js/axiodb.svg"
              alt="npm version"
              className="h-7 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://github.com/AnkanSaha/AxioDB/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main"
              alt="CodeQL"
              className="h-7 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://socket.dev/api/badge/npm/package/axiodb"
              alt="Socket Security"
              className="h-7 rounded shadow-sm hover:shadow-md transition-shadow"
            />
          </div>

          {/* Docker News Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    🚀 Latest Release
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Production Caching Made Simple!
                </h3>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  Deploy AxioDB instantly with Docker for production caching.
                  Perfect for API response caching, session management, and
                  high-performance data layers in modern applications.
                </p>
                <a
                  href="https://hub.docker.com/r/theankansaha/axiodb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
                >
                  <Download className="h-4 w-4" />
                  View on Docker Hub
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Overview */}
      <div className="relative bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-3xl p-8 lg:p-12 mb-16 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="max-w-5xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Revolutionizing Production Caching
          </h2>
          <div className="prose prose-xl dark:prose-invert max-w-none">
            <p className="text-xl lg:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
              AxioDB transforms production caching with its intelligent
              architecture, delivering sub-millisecond response times while
              eliminating the complexity of traditional cache management
              systems.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-base lg:text-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Intelligent Caching
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-4">
                  Advanced{" "}
                  <code className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 px-2 py-1 rounded-md text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                    InMemoryCache
                  </code>{" "}
                  system with automatic eviction policies and smart data
                  persistence.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Production Security
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-4">
                  Enterprise-grade encryption for sensitive cached data with
                  secure access controls.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Frontend Integration
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-4">
                  Seamless integration with React, Vue, Angular, and all modern
                  frontend frameworks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Production Caching
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Purpose-built for production environments with intelligent memory
              management, automatic cache warming, and optimized data structures
              that ensure consistent performance under heavy load.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Frontend Optimization
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Specifically designed for{" "}
              <code className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 px-2 py-1 rounded-lg text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                frontend caching
              </code>{" "}
              with React, Vue, Angular integration and real-time data
              synchronization capabilities.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                API Response Caching
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Dramatically reduce API response times with intelligent caching
              strategies, automatic invalidation, and smart data prefetching for
              optimal user experience.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Session Management
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Advanced session storage and user state management with automatic
              cleanup, secure data handling, and seamless integration with
              authentication systems.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonial/Quote Section */}
      <div className="relative bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-800 dark:to-blue-800 rounded-2xl p-8 lg:p-12 mb-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 left-4 text-6xl text-blue-400">"</div>
          <div className="absolute bottom-4 right-4 text-6xl text-blue-400 rotate-180">
            "
          </div>
        </div>
        <div className="relative z-10 text-center">
          <p className="text-2xl lg:text-3xl font-light text-white leading-relaxed mb-6">
            The definitive caching solution for production environments,
            delivering unmatched performance for modern web applications, APIs,
            and real-time systems.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded"></div>
            <span className="text-blue-200 font-medium">AxioDB Team</span>
            <div className="h-1 w-12 bg-gradient-to-r from-indigo-400 to-blue-400 rounded"></div>
          </div>
        </div>
      </div>

      <PainPoints />
    </section>
  );
};

export default Introduction;
