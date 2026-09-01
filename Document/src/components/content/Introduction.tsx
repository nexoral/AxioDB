import {
  ArrowRight,
  Bot,
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
  Command,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Seo from "../ui/Seo";
import CodeBlock from "../ui/CodeBlock";
import { githubApi } from "../../services/githubApi";
import { npmApi } from "../../services/npmApi";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const HELLO_WORLD_CODE = `// npm install axiodb
const { AxioDB } = require('axiodb');

// Create AxioDB instance with built-in GUI
const db = new AxioDB({ GUI: true }); // Enable GUI at localhost:27018

// Create database and collection
const myDB = await db.createDB('HelloWorldDB');
const collection = await myDB.createCollection('greetings');

// Insert and retrieve data - Hello World! 👋
await collection.insert({ message: 'Hello, Developer! 👋' });
const result = await collection.query({}).exec();
console.log(result.data.documents[0].message); // Hello, Developer! 👋
`;

const Introduction: React.FC = () => {
  const [totalDownloads, setTotalDownloads] = useState<number | null>(null);
  const [yearlyDownloads, setYearlyDownloads] = useState<number | null>(null);
  const [weeklyDownloads, setWeeklyDownloads] = useState<number | null>(null);
  const [monthlyDownloads, setMonthlyDownloads] = useState<number | null>(null);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(true);

  // Scroll-triggered reveal state for each below-the-fold section of the
  // page (see useScrollReveal). The hero itself animates immediately on
  // mount instead (it's already above the fold on load).
  const npmStatsReveal = useScrollReveal<HTMLDivElement>();
  const insertOpsReveal = useScrollReveal<HTMLDivElement>();
  const readOpsReveal = useScrollReveal<HTMLDivElement>();
  const updateDeleteReveal = useScrollReveal<HTMLDivElement>();
  const transactionReveal = useScrollReveal<HTMLDivElement>();
  const terminalReveal = useScrollReveal<HTMLDivElement>();
  const mcpBannerReveal = useScrollReveal<HTMLAnchorElement>();
  const cliBannerReveal = useScrollReveal<HTMLAnchorElement>();
  const cloudBannerReveal = useScrollReveal<HTMLDivElement>();
  const guiBannerReveal = useScrollReveal<HTMLDivElement>();
  const whyAxioDBReveal = useScrollReveal<HTMLDivElement>();
  const featureCardsReveal = useScrollReveal<HTMLDivElement>();
  const quoteReveal = useScrollReveal<HTMLDivElement>();
  const painPointsReveal = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    // Fetch npm download statistics
    const fetchDownloads = async () => {
      try {
        setIsLoadingDownloads(true);
        const [total, yearly, weekly, monthly] = await Promise.all([
          npmApi.getTotalDownloads(),
          npmApi.getYearlyDownloads(),
          npmApi.getDownloadsLastWeek(),
          npmApi.getDownloadsLastMonth()
        ]);
        setTotalDownloads(total);
        setYearlyDownloads(yearly);
        setWeeklyDownloads(weekly.downloads);
        setMonthlyDownloads(monthly.downloads);
      } catch (error) {
        console.error('Failed to fetch npm downloads:', error);
        setTotalDownloads(null);
        setYearlyDownloads(null);
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
      <Seo
        title="AxioDB - SQLite Alternative for JavaScript | Introduction"
        description="Embedded NoSQL database for Node.js with MongoDB-style queries, zero native dependencies, and a built-in web GUI. Install with npm and start building in seconds."
        path="/"
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-gray-200 shadow-md animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100/40 rounded-full blur-3xl animate-blob-drift"></div>
        <div
          className="absolute bottom-0 left-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl animate-blob-drift"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 animate-slide-in-right">
            <div className="p-2 bg-accent-600 rounded-lg animate-glow">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>Production Ready</span>
              <span>•</span>
              <Users className="h-4 w-4 text-green-500" />
              <span>Developer Friendly</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 rounded-full border border-green-200 mb-4 animate-pulse">
              <span className="text-lg">👋</span>
              <span className="text-green-700 font-semibold">
                Hello, Developer!
              </span>
              <span className="text-sm text-green-600">
                Welcome to AxioDB
              </span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-8 text-gray-900 leading-tight tracking-tight">
            AxioDB
          </h1>
          <div className="space-y-4 mb-10">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-700 font-medium leading-tight">
              SQLite Alternative for JavaScript
            </p>
            <p className="text-lg lg:text-xl text-gray-600 font-light leading-relaxed max-w-4xl">
              Embedded NoSQL database for Node.js with MongoDB-style queries. Zero native dependencies,
              no compilation, no platform issues. Pure JavaScript from npm install to production.
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <img
              src={badgeUrls.npm}
              alt="npm version"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/npm/v/axiodb?logo=npm&label=npm"
              alt="npm shields"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/npm/dt/axiodb.svg"
              alt="npm downloads total"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/npm/dm/axiodb.svg"
              alt="npm downloads monthly"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/npm/unpacked-size/axiodb?label=install%20size"
              alt="install size"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/jsdelivr/npm/hm/axiodb?label=jsDelivr"
              alt="jsDelivr hits"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src={badgeUrls.codeql}
              alt="CodeQL"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src={badgeUrls.socket}
              alt="Socket Security"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src={badgeUrls.stars}
              alt="GitHub Stars"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen"
              alt="Node.js Version"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/badge/TypeScript-6.0-blue"
              alt="TypeScript"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
            <img
              src="https://img.shields.io/badge/dependencies-0%20native-success"
              alt="Zero Dependencies"
              className="h-6 rounded shadow-sm hover:shadow-md transition-shadow"
            />
          </div>

          {/* New Feature Banner: MCP Server */}
          <a
            ref={mcpBannerReveal.ref}
            href="/mcp-server"
            className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-accent-50 px-6 py-5 rounded-xl border-2 border-fuchsia-200 shadow-md hover:shadow-lg transition-all duration-300 mb-8 reveal-on-scroll ${mcpBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-full font-bold shadow-md animate-pulse-ring">
                  NEW
                </span>
                <span className="text-lg font-black text-accent-600">
                  AxioDB MCP Server
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Spin up AxioDB on a cloud container and let your AI agent (Claude, or any
                MCP-compatible client) talk to that database directly — 43 tools, real login,
                the exact same RBAC as the web GUI.
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-fuchsia-600 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
          </a>

          {/* New Feature Banner: CLI */}
          <a
            ref={cliBannerReveal.ref}
            href="/cli"
            className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-emerald-50 px-6 py-5 rounded-xl border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all duration-300 mb-8 reveal-on-scroll ${cliBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Command className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full font-bold shadow-md animate-pulse-ring">
                  NEW
                </span>
                <span className="text-lg font-black text-emerald-700">
                  AxioDB CLI
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Go-based command line interface for AxioDB — interactive REPL with MongoDB shell syntax,
                all 32 TCP commands, TLS support, and installers for 12 platforms.
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-emerald-600 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
          </a>

          {/* NPM Download Stats */}
          <div
            ref={npmStatsReveal.ref}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 reveal-stagger-grid"
          >
            {/* Total Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 bg-orange-50 px-5 py-3 rounded-xl border border-amber-200 shadow-lg hover:shadow-md transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-600">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : totalDownloads !== null ? (
                      npmApi.formatDownloadCount(totalDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-amber-700" />
                </div>
                <span className="text-xs text-amber-700 font-medium">
                  Total Downloads
                </span>
              </div>
            </a>

            {/* Yearly Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 bg-accent-50 px-5 py-3 rounded-xl border border-purple-200 shadow-lg hover:shadow-md transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent-600">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : yearlyDownloads !== null ? (
                      npmApi.formatDownloadCount(yearlyDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-purple-700" />
                </div>
                <span className="text-xs text-purple-700 font-medium">
                  Yearly Downloads
                </span>
              </div>
            </a>

            {/* Weekly Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 bg-accent-50 px-5 py-3 rounded-xl border border-accent-200 shadow-lg hover:shadow-md transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-accent-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent-600">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : weeklyDownloads !== null ? (
                      npmApi.formatDownloadCount(weeklyDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-accent-600" />
                </div>
                <span className="text-xs text-accent-600 font-medium">
                  Last Week
                </span>
              </div>
            </a>

            {/* Monthly Downloads */}
            <a
              href={npmApi.getNpmPackageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 bg-green-50 px-5 py-3 rounded-xl border border-green-200 shadow-lg hover:shadow-md transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    {isLoadingDownloads ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : monthlyDownloads !== null ? (
                      npmApi.formatDownloadCount(monthlyDownloads)
                    ) : (
                      '---'
                    )}
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs text-green-700 font-medium">
                  Last Month
                </span>
              </div>
            </a>
          </div>

          {/* Performance Metrics & ACID Compliance */}
          <div className="mb-8">
            {/* ACID Compliance Banner */}
            <div className="flex items-center justify-center gap-3 bg-orange-50 px-6 py-4 rounded-xl border-2 border-amber-200 shadow-md mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-500 rounded-xl shadow-lg">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-orange-600">
                    ACID Compliant
                  </span>
                  <span className="text-sm bg-amber-500 text-gray-900 px-3 py-1 rounded-full font-bold shadow-md">
                    ✓ Transactions
                  </span>
                </div>
                <span className="text-sm text-amber-700 font-medium">
                  Full Transaction Support with Commit, Rollback & Write-Ahead Logging Recovery
                </span>
              </div>
            </div>

            {/* Performance Benchmark Header */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600">⚡ Performance Benchmark</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-600">Tested: March 2026</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span>💻 Ubuntu Linux</span>
                  <span>•</span>
                  <span>Node.js v20+</span>
                  <span>•</span>
                  <span className="font-bold text-amber-700">📊 10,000 documents dataset</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics Grid - Comprehensive */}
            
            {/* INSERT Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-2 px-1">📥 Insert Operations</p>
              <div ref={insertOpsReveal.ref} className="grid grid-cols-2 md:grid-cols-3 gap-3 reveal-stagger-grid">
                <div className={`relative bg-accent-50 px-4 py-3 rounded-xl border border-accent-200 shadow-md hover:shadow-lg transition-all reveal-on-scroll ${insertOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-xl font-black text-accent-600">~3ms</span>
                    <p className="text-xs text-accent-600 font-semibold">Insert Single</p>
                  </div>
                </div>
                <div className={`relative bg-accent-50 px-4 py-3 rounded-xl border border-accent-200 shadow-md hover:shadow-lg transition-all reveal-on-scroll ${insertOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-xl font-black text-accent-600">~87ms</span>
                    <p className="text-xs text-accent-600 font-semibold">InsertMany (10)</p>
                  </div>
                </div>
                <div className={`relative bg-accent-50 px-4 py-3 rounded-xl border border-accent-200 shadow-md hover:shadow-lg transition-all reveal-on-scroll ${insertOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-xl font-black text-accent-600">&lt;1ms</span>
                    <p className="text-xs text-accent-600 font-semibold">Validation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* READ/QUERY Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 px-1">📖 Read/Query Operations (10K docs)</p>
              <div ref={readOpsReveal.ref} className="grid grid-cols-3 md:grid-cols-6 gap-2 reveal-stagger-grid">
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~2ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Indexed</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~1ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">documentId</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~1ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">findOne</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~2ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Projection</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~469ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">$gt</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~401ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">$in</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~454ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Limit</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~404ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Skip</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~382ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Sort</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~434ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">setCount</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~2.8s</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Regex</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~2.6s</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Full Scan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* UPDATE & DELETE Operations */}
            <div ref={updateDeleteReveal.ref} className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 px-1">✏️ Update Operations</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 reveal-stagger-grid">
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-amber-200 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-700">~8ms</span>
                      <p className="text-[10px] text-amber-700 font-semibold">UpdateOne</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-amber-200 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-700">~466ms</span>
                      <p className="text-[10px] text-amber-700 font-semibold">UpdateMany</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-amber-200 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-700">~1ms</span>
                      <p className="text-[10px] text-amber-700 font-semibold">Verify</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">🗑️ Delete Operations</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 reveal-stagger-grid">
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-red-700 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-red-400">~3ms</span>
                      <p className="text-[10px] text-red-300 font-semibold">DeleteOne</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-red-700 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-red-400">~446ms</span>
                      <p className="text-[10px] text-red-300 font-semibold">DeleteMany</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-red-700 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-red-400">~463ms</span>
                      <p className="text-[10px] text-red-300 font-semibold">Verify</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TRANSACTION Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2 px-1">🔄 Transaction Operations</p>
              <div ref={transactionReveal.ref} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 reveal-stagger-grid">
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~23ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Insert</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~14ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Update</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~15ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Delete</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~23ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Mixed</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~3ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">Rollback</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~14ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">Savepoint</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~10ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">withTX</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~12ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">Index Sync</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Welcome Section */}
          <div
            ref={terminalReveal.ref}
            className={`relative bg-ink-950 rounded-xl p-6 mb-8 shadow-lg border border-gray-200 overflow-hidden reveal-on-scroll ${terminalReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="absolute top-0 left-0 w-full h-4 bg-gray-800 flex items-center justify-start px-4 gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400 ml-2">terminal</span>
            </div>
            <div className="pt-6 font-mono text-sm">
              <div className="text-green-400 mb-2">$ npm install axiodb</div>
              <div className="text-gray-400 mb-3">+ axiodb@latest  # No native dependencies, no compilation</div>
              <div className="text-green-400 mb-2">$ node app.js</div>
              <div className="text-cyan-300 mb-1">✓ AxioDB initialized</div>
              <div className="text-cyan-300 mb-1">✓ Database ready at ./AxioDB</div>
              <div className="text-cyan-300 mb-3">✓ GUI available on localhost:27018</div>
              <div className="text-yellow-300 mb-3">💡 Think SQLite, but NoSQL with JavaScript queries</div>
              <div className="text-pink-300 mb-4">🎯 Perfect for: Desktop apps • CLI tools • Node.js backends</div>
              <div className="flex items-center">
                <span className="text-green-400">$</span>
                <span className="text-white ml-2 animate-pulse">Your embedded database is ready...</span>
                <span className="text-white ml-1 animate-ping">|</span>
              </div>
            </div>
          </div>

          {/* Hello World Code Example */}
          <div className="bg-gray-50 text-gray-900 rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Code className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    🚀 Quick Start
                  </span>
                  <span className="text-green-600 text-sm">Get running in 30 seconds</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">Hello World with AxioDB</h3>
                <div className="bg-accent-100/20 border border-accent-600/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-accent-600 text-sm">
                    <span>ℹ️</span>
                    <span className="font-semibold">Node.js Required:</span>
                    <span>AxioDB runs on Node.js servers, not in browsers</span>
                  </div>
                </div>
                <CodeBlock code={HELLO_WORLD_CODE} language="javascript" />
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/installation"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 shadow-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    Install Now
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/usage"
                    className="inline-flex items-center gap-2 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    <Code className="h-4 w-4" />
                    View Examples
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* AxioDBCloud Promotional Banner - NEW! */}
          <div
            ref={cloudBannerReveal.ref}
            className={`relative overflow-hidden bg-gray-100 rounded-lg p-8 mb-8 shadow-lg border-2 border-accent-500 reveal-on-scroll ${cloudBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30 shadow-lg">
                    <Cloud className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold mb-3 animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    NEW FEATURE
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                    Introducing AxioDBCloud
                  </h3>
                  <p className="text-xl text-accent-700 mb-4 leading-relaxed">
                    Deploy AxioDB in Docker or Cloud. Connect from anywhere with TCP protocol. Same API, zero code changes!
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <Zap className="h-4 w-4 text-amber-700" />
                      <span className="text-sm text-gray-900 font-semibold">Fast TCP Protocol</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <Server className="h-4 w-4 text-green-700" />
                      <span className="text-sm text-gray-900 font-semibold">1000+ Connections</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                      <RefreshCw className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm text-gray-900 font-semibold">Auto-Reconnect</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/cloud"
                      className="inline-flex items-center gap-2 bg-white text-accent-600 px-6 py-3 rounded-lg font-bold hover:bg-accent-50 shadow-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Cloud className="h-5 w-5" />
                      Explore AxioDBCloud
                      <ArrowRight className="h-5 w-5" />
                    </a>
                    <a
                      href="/cloud"
                      className="inline-flex items-center gap-2 border-2 border-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
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
          <div
            ref={guiBannerReveal.ref}
            className={`bg-accent-50 text-gray-900 rounded-xl p-6 mb-8 border border-accent-200 shadow-sm reveal-on-scroll ${guiBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-accent-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-accent-700">
                    🎨 Built-in GUI
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Database Visualization Built In
                </h3>
                <p className="text-accent-700 mb-4 leading-relaxed">
                  Start AxioDB with <code className="bg-accent-100 px-2 py-1 rounded text-accent-800">new AxioDB(&#123; GUI: true &#125;)</code> to
                  enable the built-in web GUI on localhost:27018. Perfect for Electron apps—give
                  your users a database inspector without extra dependencies.
                </p>
                <a
                  href="/usage#gui"
                  className="inline-flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-700 transition-colors shadow-sm hover:shadow-md"
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
      <div
        ref={whyAxioDBReveal.ref}
        className={`relative bg-gray-50 rounded-xl p-5 sm:p-8 lg:p-12 mb-16 border border-gray-200 shadow-lg reveal-on-scroll ${whyAxioDBReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="max-w-5xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Why AxioDB?
          </h2>
          <div className="prose prose-xl prose-invert max-w-none">
            <p className="text-xl lg:text-2xl leading-relaxed text-gray-600 mb-6">
              SQLite requires native C bindings that cause deployment headaches. JSON files have no
              querying or caching. MongoDB needs a separate server. AxioDB combines the best of all:
              embedded like SQLite, NoSQL queries like MongoDB, intelligent caching built-in.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-base lg:text-lg reveal-stagger-grid">
              <div className={`space-y-2 reveal-on-scroll ${whyAxioDBReveal.isVisible ? "is-visible" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700">
                    Pure JavaScript
                  </span>
                </div>
                <p className="text-gray-600 ml-4">
                  Zero native dependencies. No compilation, no platform-specific binaries,
                  no{" "}
                  <code className="bg-accent-50 px-2 py-1 rounded-md text-accent-600 font-semibold border border-accent-200">
                    node-gyp
                  </code>{" "}
                  headaches. Works everywhere Node.js runs.
                </p>
              </div>
              <div className={`space-y-2 reveal-on-scroll ${whyAxioDBReveal.isVisible ? "is-visible" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700">
                    Intelligent Caching
                  </span>
                </div>
                <p className="text-gray-600 ml-4">
                  Built-in InMemoryCache with automatic invalidation. Instant query results
                  for frequently-accessed data. Multi-core parallelism with Worker Threads.
                </p>
              </div>
              <div className={`space-y-2 reveal-on-scroll ${whyAxioDBReveal.isVisible ? "is-visible" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700">
                    MongoDB-Style Queries
                  </span>
                </div>
                <p className="text-gray-600 ml-4">
                  JavaScript objects, not SQL strings. Operators like{" "}
                  <code className="bg-accent-50 px-2 py-1 rounded-md text-purple-700 font-semibold border border-purple-200">
                    $gt
                  </code>,{" "}
                  <code className="bg-accent-50 px-2 py-1 rounded-md text-purple-700 font-semibold border border-purple-200">
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
      <div ref={featureCardsReveal.ref} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 reveal-stagger-grid">
        <div className={`group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-orange-200 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Node.js Applications
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Embedded database for Node.js apps requiring local storage. No external
              dependencies, no server setup, no compilation. Works on all platforms
              without native bindings.
            </p>
          </div>
        </div>

        <div className={`group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-accent-600 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Desktop & CLI Tools
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Perfect for desktop apps (Electron, Tauri) and CLI tools. Store configuration,
              cache data, manage local state—all with{" "}
              <code className="bg-accent-50 px-2 py-1 rounded-lg text-accent-600 font-semibold border border-accent-200">
                npm install
              </code>.
            </p>
          </div>
        </div>

        <div className={`group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-green-200 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Rapid Prototyping
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Skip database setup entirely. Query with JavaScript objects, not SQL strings.
              Handles 10K-500K documents with intelligent caching. Migrate to PostgreSQL
              or MongoDB when you scale.
            </p>
          </div>
        </div>

        <div className={`group relative bg-white rounded-lg shadow-lg hover:shadow-lg transition-all duration-300 p-8 border border-gray-200 hover:border-purple-200 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:shadow-md transition-shadow">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Embedded Systems
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">
              Local-first applications, IoT devices, edge computing. Single-instance
              architecture with file-based storage. Built-in GUI for data inspection
              during development.
            </p>
          </div>
        </div>
      </div>

      {/* Honest Positioning Section */}
      <div
        ref={quoteReveal.ref}
        className={`relative bg-accent-50 border border-accent-200 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 overflow-hidden reveal-on-scroll ${quoteReveal.isVisible ? "is-visible animate-scale-in" : ""}`}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 left-4 text-6xl text-accent-600">"</div>
          <div className="absolute bottom-4 right-4 text-6xl text-accent-600 rotate-180">
            "
          </div>
        </div>
        <div className="relative z-10 text-center">
          <p className="text-2xl lg:text-3xl font-light text-gray-900 leading-relaxed mb-6">
            AxioDB is not competing with PostgreSQL or MongoDB. It's for when you need
            a database embedded in your app—Electron, CLI tools, local-first apps.
            Sweet spot: 10K-500K documents. No native dependencies, no server setup.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-1 w-12 bg-gray-100 rounded"></div>
            <span className="text-accent-700 font-medium">Honest positioning</span>
            <div className="h-1 w-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>

      {/* Pain Points Section: why not SQLite, JSON files, or MongoDB */}
      <div
        ref={painPointsReveal.ref}
        className={`relative reveal-on-scroll ${painPointsReveal.isVisible ? "is-visible animate-fade-in-up" : ""}`}
      >
        <div className="mt-8 flex flex-col items-center">
          <div className={`max-w-3xl text-center mb-6 ${painPointsReveal.isVisible ? "animate-slide-in-right" : ""}`}>
            <h3 className="text-2xl font-bold text-accent-600 mb-4">
              The Problem With the Usual Options
            </h3>
            <div className="text-left bg-gray-100 rounded-xl p-6 mb-6 shadow-lg border border-gray-200">
              <div className="space-y-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">SQLite:</h4>
                  <ul className="space-y-1 text-gray-600 pl-6 text-sm">
                    <li>✗ Requires native C bindings (better-sqlite3, node-sqlite3)</li>
                    <li>✗ <code className="bg-gray-200 px-1.5 py-0.5 rounded">electron-rebuild</code> on every Electron update, platform-specific compilation</li>
                    <li>✗ SQL strings instead of JavaScript objects</li>
                    <li>✗ Schema migrations when your data model changes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">JSON Files:</h4>
                  <ul className="space-y-1 text-gray-600 pl-6 text-sm">
                    <li>✗ Full file read/write for every operation</li>
                    <li>✗ No built-in querying, indexing, or caching</li>
                    <li>✗ Linear O(n) search performance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">MongoDB (Server):</h4>
                  <ul className="space-y-1 text-gray-600 pl-6 text-sm">
                    <li>✗ Requires a separate server process</li>
                    <li>✗ Overkill for small-to-medium, single-app datasets</li>
                    <li>✗ Not suitable for embedded/desktop scenarios</li>
                  </ul>
                </div>
              </div>
              <p className="text-lg text-gray-600 mb-2">
                AxioDB is pure JavaScript, embedded, with MongoDB-style queries built in:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Works everywhere Node.js runs—no rebuild, no native dependencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>MongoDB-style queries: <code className="bg-gray-200 px-2 py-1 rounded">{`{age: {$gt: 25}}`}</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Schema-less JSON documents—no migrations</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                See the full <a href="/comparison" className="underline font-medium">feature-by-feature comparison</a> against
                SQLite, JSON files, lowdb, nedb, and better-sqlite3.
              </p>
            </div>
            <div className="flex justify-center gap-4 animate-glow">
              <a href="/installation" className="inline-block">
                <button className="bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-accent-700 transition-all duration-200 transform hover:scale-105">
                  🚀 npm install axiodb
                </button>
              </a>
              <a href="/usage" className="inline-block">
                <button className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105">
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
