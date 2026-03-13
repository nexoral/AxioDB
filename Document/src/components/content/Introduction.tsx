import {
  ArrowRight,
  Cloud,
  Code,
  Database,
  Download,
  GitBranch,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Star,
  Terminal,
  Users,
  Zap,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { React as Service } from "react-caches";
import { githubApi } from "../../services/githubApi";
import { npmApi } from "../../services/npmApi";

const Introduction: React.FC = () => {
  const [totalDownloads, setTotalDownloads] = useState<number | null>(null);
  const [weeklyDownloads, setWeeklyDownloads] = useState<number | null>(null);
  const [monthlyDownloads, setMonthlyDownloads] = useState<number | null>(null);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(true);

  useEffect(() => {
    Service.UpdateDocumentTitle("AxioDB - Pure JavaScript Alternative to SQLite | Introduction");

    // Fetch npm download statistics
    const fetchDownloads = async () => {
      try {
        setIsLoadingDownloads(true);
        const [total, weekly, monthly] = await Promise.all([
          npmApi.getTotalDownloads(),
          npmApi.getDownloadsLastWeek(),
          npmApi.getDownloadsLastMonth()
        ]);
        setTotalDownloads(total);
        setWeeklyDownloads(weekly.downloads);
        setMonthlyDownloads(monthly.downloads);
      } catch (error) {
        console.error('Failed to fetch npm downloads:', error);
        setTotalDownloads(null);
        setWeeklyDownloads(null);
        setMonthlyDownloads(null);
      } finally {
        setIsLoadingDownloads(false);
      }
    };

    fetchDownloads();
  }, []);

  const badgeUrls = {
    npm: githubApi.getBadgeUrl('npm'),
    codeql: githubApi.getBadgeUrl('github-actions'),
    socket: githubApi.getBadgeUrl('socket')
  };

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

          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full border border-green-200 dark:border-green-700 mb-4 animate-pulse">
              <span className="text-lg">👋</span>
              <span className="text-green-700 dark:text-green-300 font-semibold">
                Hello, Developer!
              </span>
              <span className="text-sm text-green-600 dark:text-green-400">
                Welcome to AxioDB
              </span>
            </div>
          </div>
          <h1 className="text-5xl lg:text-7xl xl:text-8xl font-extrabold mb-8 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight tracking-tight">
            AxioDB
          </h1>
          <div className="space-y-4 mb-10">
            <p className="text-2xl lg:text-3xl xl:text-4xl text-slate-700 dark:text-slate-200 font-medium leading-tight">
              The Pure JavaScript Alternative to SQLite
            </p>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-4xl">
              Embedded NoSQL database for Node.js with MongoDB-style queries. Zero native dependencies,
              no compilation, no platform issues. Pure JavaScript from npm install to production.
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <img
              src={badgeUrls.npm}
              alt="npm version"
              className="h-7 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src={badgeUrls.codeql}
              alt="CodeQL"
              className="h-7 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src={badgeUrls.socket}
              alt="Socket Security"
              className="h-7 rounded shadow-sm hover:shadow-md transition-shadow"
            />
          </div>

          {/* NPM Download Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-5 py-3 rounded-xl border border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : totalDownloads !== null ? (
                      npmApi.formatDownloadCount(totalDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  Total Downloads
                </span>
              </div>
            </a>

            {/* Weekly Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 px-5 py-3 rounded-xl border border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : weeklyDownloads !== null ? (
                      npmApi.formatDownloadCount(weeklyDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Last Week
                </span>
              </div>
            </a>

            {/* Monthly Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-5 py-3 rounded-xl border border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : monthlyDownloads !== null ? (
                      npmApi.formatDownloadCount(monthlyDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                  Last Month
                </span>
              </div>
            </a>
          </div>

          {/* Performance Metrics & ACID Compliance */}
          <div className="mb-8">
            {/* ACID Compliance Banner */}
            <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-900/40 dark:via-yellow-900/30 dark:to-amber-900/40 px-6 py-4 rounded-xl border-2 border-amber-300 dark:border-amber-600 shadow-xl mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-lg">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black bg-gradient-to-r from-amber-700 to-yellow-600 dark:from-amber-300 dark:to-yellow-300 bg-clip-text text-transparent">
                    ACID Compliant
                  </span>
                  <span className="text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                    ✓ Transactions
                  </span>
                </div>
                <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Full Transaction Support with Commit, Rollback & Write-Ahead Logging Recovery
                </span>
              </div>
            </div>

            {/* Performance Benchmark Header */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">⚡ Performance Benchmark</span>
                  <span className="text-slate-500 dark:text-slate-400">|</span>
                  <span className="text-slate-600 dark:text-slate-400">Tested: March 2026</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>💻 Ubuntu Linux</span>
                  <span>•</span>
                  <span>Node.js v20+</span>
                  <span>•</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">📊 10,000 documents dataset</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics Grid - Comprehensive */}
            
            {/* INSERT Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 px-1">📥 Insert Operations</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg transition-all">
                  <div className="text-center">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">~3ms</span>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Insert Single</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg transition-all">
                  <div className="text-center">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">~87ms</span>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">InsertMany (10)</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg transition-all">
                  <div className="text-center">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">&lt;1ms</span>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Validation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* READ/QUERY Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 px-1">📖 Read/Query Operations (10K docs)</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~2ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Indexed</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~1ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">documentId</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~1ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">findOne</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~2ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Projection</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~469ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">$gt</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~401ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">$in</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~454ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Limit</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~404ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Skip</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~382ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Sort</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~434ms</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">setCount</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~2.8s</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Regex</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all">
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~2.6s</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Full Scan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* UPDATE & DELETE Operations */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 px-1">✏️ Update Operations</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 shadow-sm">
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">~8ms</span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">UpdateOne</p>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 shadow-sm">
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">~466ms</span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">UpdateMany</p>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 shadow-sm">
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">~1ms</span>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">Verify</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 px-1">🗑️ Delete Operations</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 shadow-sm">
                    <div className="text-center">
                      <span className="text-lg font-black text-red-600 dark:text-red-400">~3ms</span>
                      <p className="text-[10px] text-red-700 dark:text-red-300 font-semibold">DeleteOne</p>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 shadow-sm">
                    <div className="text-center">
                      <span className="text-lg font-black text-red-600 dark:text-red-400">~446ms</span>
                      <p className="text-[10px] text-red-700 dark:text-red-300 font-semibold">DeleteMany</p>
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 shadow-sm">
                    <div className="text-center">
                      <span className="text-lg font-black text-red-600 dark:text-red-400">~463ms</span>
                      <p className="text-[10px] text-red-700 dark:text-red-300 font-semibold">Verify</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TRANSACTION Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2 px-1">🔄 Transaction Operations</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~23ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">TX Insert</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~14ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">TX Update</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~15ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">TX Delete</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~23ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">TX Mixed</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~3ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">Rollback</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~14ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">Savepoint</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~10ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">withTX</p>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-2 py-2 rounded-lg border border-violet-200 dark:border-violet-700 shadow-sm">
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">~12ms</span>
                    <p className="text-[10px] text-violet-700 dark:text-violet-300 font-semibold">Index Sync</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Welcome Section */}
          <div className="relative bg-gray-900 dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg border border-gray-700 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-gray-800 dark:bg-gray-700 flex items-center justify-start px-4 gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400 ml-2">terminal</span>
            </div>
            <div className="pt-6 font-mono text-sm">
              <div className="text-green-400 mb-2">$ npm install axiodb</div>
              <div className="text-gray-400 mb-3">+ axiodb@latest  # No native dependencies, no compilation</div>
              <div className="text-green-400 mb-2">$ node app.js</div>
              <div className="text-cyan-400 mb-1">✓ AxioDB initialized</div>
              <div className="text-cyan-400 mb-1">✓ Database ready at ./AxioDB</div>
              <div className="text-cyan-400 mb-3">✓ GUI available on localhost:27018</div>
              <div className="text-yellow-400 mb-3">💡 Think SQLite, but NoSQL with JavaScript queries</div>
              <div className="text-blue-400 mb-4">🎯 Perfect for: Desktop apps • CLI tools • Node.js backends</div>
              <div className="flex items-center">
                <span className="text-green-400">$</span>
                <span className="text-white ml-2 animate-pulse">Your embedded database is ready...</span>
                <span className="text-white ml-1 animate-ping">|</span>
              </div>
            </div>
          </div>

          {/* Hello World Code Example */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 text-white rounded-xl p-6 mb-8 shadow-lg border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Code className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    🚀 Quick Start
                  </span>
                  <span className="text-green-400 text-sm">Get running in 30 seconds</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">Hello World with AxioDB</h3>
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-blue-300 text-sm">
                    <span>ℹ️</span>
                    <span className="font-semibold">Node.js Required:</span>
                    <span>AxioDB runs on Node.js servers, not in browsers</span>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400 mb-2">// npm install axiodb</div>
                  <span className="text-blue-400">const</span> <span className="text-white">{'{'}</span> <span className="text-yellow-300">AxioDB</span> <span className="text-white">{'}'}</span> <span className="text-blue-400">=</span> <span className="text-yellow-300">require</span><span className="text-white">(</span><span className="text-green-300">'axiodb'</span><span className="text-white">);</span><br />
                  <br />
                  <div className="text-gray-400">// Create AxioDB instance with built-in GUI</div>
                  <span className="text-blue-400">const</span> <span className="text-white">db</span> <span className="text-blue-400">=</span> <span className="text-blue-400">new</span> <span className="text-yellow-300">AxioDB</span><span className="text-white">(</span><span className="text-orange-400">true</span><span className="text-white">);</span> <span className="text-gray-400">// Enable GUI at localhost:27018</span><br />
                  <br />
                  <div className="text-gray-400">// Create database and collection</div>
                  <span className="text-blue-400">const</span> <span className="text-white">myDB</span> <span className="text-blue-400">=</span> <span className="text-blue-400">await</span> <span className="text-white">db.</span><span className="text-yellow-300">createDB</span><span className="text-white">(</span><span className="text-green-300">'HelloWorldDB'</span><span className="text-white">);</span><br />
                  <span className="text-blue-400">const</span> <span className="text-white">collection</span> <span className="text-blue-400">=</span> <span className="text-blue-400">await</span> <span className="text-white">myDB.</span><span className="text-yellow-300">createCollection</span><span className="text-white">(</span><span className="text-green-300">'greetings'</span><span className="text-white">);</span><br />
                  <br />
                  <div className="text-gray-400">// Insert and retrieve data - Hello World! 👋</div>
                  <span className="text-blue-400">await</span> <span className="text-white">collection.</span><span className="text-yellow-300">insert</span><span className="text-white">(</span><span className="text-white">{'{'}</span> <span className="text-cyan-400">message:</span> <span className="text-green-300">'Hello, Developer! 👋'</span> <span className="text-white">{'}'});</span><br />
                  <span className="text-blue-400">const</span> <span className="text-white">result</span> <span className="text-blue-400">=</span> <span className="text-blue-400">await</span> <span className="text-white">collection.</span><span className="text-yellow-300">query</span><span className="text-white">(</span><span className="text-white">{'{'}</span><span className="text-white">{'}'}</span><span className="text-white">).</span><span className="text-yellow-300">exec</span><span className="text-white">();</span><br />
                  <span className="text-blue-400">console</span><span className="text-white">.</span><span className="text-yellow-300">log</span><span className="text-white">(</span><span className="text-white">result</span><span className="text-white">[</span><span className="text-orange-400">0</span><span className="text-white">].</span><span className="text-cyan-400">message</span><span className="text-white">);</span> <span className="text-gray-400">// Hello, Developer! 👋</span>
                </div>
                <div className="flex gap-3">
                  <a
                    href="/installation"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    Install Now
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/usage"
                    className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    <Code className="h-4 w-4" />
                    View Examples
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* AxioDBCloud Promotional Banner - NEW! */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 rounded-2xl p-8 mb-8 shadow-2xl border-2 border-blue-400 dark:border-blue-500">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/30 shadow-lg">
                    <Cloud className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold mb-3 animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    NEW FEATURE
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
                    Introducing AxioDBCloud
                  </h3>
                  <p className="text-xl text-blue-100 mb-4 leading-relaxed">
                    Deploy AxioDB in Docker or Cloud. Connect from anywhere with TCP protocol. Same API, zero code changes!
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <Zap className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm text-white font-semibold">Fast TCP Protocol</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <Server className="h-4 w-4 text-green-300" />
                      <span className="text-sm text-white font-semibold">1000+ Connections</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <RefreshCw className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm text-white font-semibold">Auto-Reconnect</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/cloud"
                      className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Cloud className="h-5 w-5" />
                      Explore AxioDBCloud
                      <ArrowRight className="h-5 w-5" />
                    </a>
                    <a
                      href="/cloud"
                      className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
                    >
                      <Terminal className="h-5 w-5" />
                      Docker Setup
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Built-in GUI Banner */}
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
                    🎨 Built-in GUI
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Database Visualization Built In
                </h3>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  Start AxioDB with <code className="bg-white/20 px-2 py-1 rounded">new AxioDB(true)</code> to
                  enable the built-in web GUI on localhost:27018. Perfect for Electron apps—give
                  your users a database inspector without extra dependencies.
                </p>
                <a
                  href="/usage#gui"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
                >
                  <Code className="h-4 w-4" />
                  View GUI Documentation
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
            Why AxioDB?
          </h2>
          <div className="prose prose-xl dark:prose-invert max-w-none">
            <p className="text-xl lg:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
              SQLite requires native C bindings that cause deployment headaches. JSON files have no
              querying or caching. MongoDB needs a separate server. AxioDB combines the best of all:
              embedded like SQLite, NoSQL queries like MongoDB, intelligent caching built-in.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-base lg:text-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Pure JavaScript
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-4">
                  Zero native dependencies. No compilation, no platform-specific binaries,
                  no{" "}
                  <code className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 px-2 py-1 rounded-md text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                    node-gyp
                  </code>{" "}
                  headaches. Works everywhere Node.js runs.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Intelligent Caching
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-4">
                  Built-in InMemoryCache with automatic invalidation. Instant query results
                  for frequently-accessed data. Multi-core parallelism with Worker Threads.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    MongoDB-Style Queries
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-4">
                  JavaScript objects, not SQL strings. Operators like{" "}
                  <code className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 px-2 py-1 rounded-md text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                    $gt
                  </code>,{" "}
                  <code className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 px-2 py-1 rounded-md text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                    $regex
                  </code>,{" "}
                  aggregation pipelines, schema-less documents.
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
                Node.js Applications
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Embedded database for Node.js apps requiring local storage. No external
              dependencies, no server setup, no compilation. Works on all platforms
              without native bindings.
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
                Desktop & CLI Tools
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Perfect for desktop apps (Electron, Tauri) and CLI tools. Store configuration,
              cache data, manage local state—all with{" "}
              <code className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 px-2 py-1 rounded-lg text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                npm install
              </code>.
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
                Rapid Prototyping
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Skip database setup entirely. Query with JavaScript objects, not SQL strings.
              Handles 10K-500K documents with intelligent caching. Migrate to PostgreSQL
              or MongoDB when you scale.
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
                Embedded Systems
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              Local-first applications, IoT devices, edge computing. Single-instance
              architecture with file-based storage. Built-in GUI for data inspection
              during development.
            </p>
          </div>
        </div>
      </div>

      {/* Honest Positioning Section */}
      <div className="relative bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-800 dark:to-blue-800 rounded-2xl p-8 lg:p-12 mb-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 left-4 text-6xl text-blue-400">"</div>
          <div className="absolute bottom-4 right-4 text-6xl text-blue-400 rotate-180">
            "
          </div>
        </div>
        <div className="relative z-10 text-center">
          <p className="text-2xl lg:text-3xl font-light text-white leading-relaxed mb-6">
            AxioDB is not competing with PostgreSQL or MongoDB. It's for when you need
            a database embedded in your app—Electron, CLI tools, local-first apps.
            Sweet spot: 10K-500K documents. No native dependencies, no server setup.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded"></div>
            <span className="text-blue-200 font-medium">Honest positioning</span>
            <div className="h-1 w-12 bg-gradient-to-r from-indigo-400 to-blue-400 rounded"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Pain Points Section */}
      <div className="relative animate-fade-in-up">
        <div className="mt-8 flex flex-col items-center">
          <div className="max-w-3xl text-center mb-6 animate-slide-in-right">
            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-4">
              Why Use AxioDB Instead of SQLite?
            </h3>
            <div className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                SQLite is great, but it requires native bindings that break in Electron:
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">electron-rebuild</code> on every Electron update</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Platform-specific builds (Windows .node files ≠ Mac .node files)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>SQL strings instead of JavaScript objects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Schema migrations when your data model changes</span>
                </li>
              </ul>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">
                AxioDB is pure JavaScript:
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Works everywhere Node.js runs—no rebuild, no native dependencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>MongoDB-style queries: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{`{age: {$gt: 25}}`}</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Schema-less JSON documents—no migrations</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center gap-4 animate-glow">
              <a href="/installation" className="inline-block">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">
                  🚀 npm install axiodb
                </button>
              </a>
              <a href="/usage" className="inline-block">
                <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105">
                  📚 Read the Docs
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Introduction;
