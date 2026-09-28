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
  Copy,
  Check,
  Monitor,
  Globe,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

// Insert and retrieve data - Hello World!
await collection.insert({ message: 'Hello, Developer!' });
const result = await collection.query({}).exec();
console.log(result.data.documents[0].message); // Hello, Developer!
`;

  // Hero code tabs, mirroring nodejs.org's tabbed sample panel. Each snippet is
  // a real, runnable slice of AxioDB - the same API the docs describe.
  const HERO_TABS = [
    {
      label: "Quick start",
      language: "javascript",
      code: HELLO_WORLD_CODE,
    },
    {
      label: "Insert a document",
      language: "javascript",
      code: `const { AxioDB } = require('axiodb');

const db = new AxioDB();
const users = await (await db.createDB('AppDB')).createCollection('users');

const created = await users.insert({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
});
console.log(created.data.documentId);`,
    },
    {
      label: "Query with operators",
      language: "javascript",
      code: `// MongoDB-style operators, 19 of them
const adults = await users
  .query({ age: { $gte: 18 } })
  .Sort({ age: -1 })
  .Limit(10)
  .exec();

console.log(adults.data.documents);`,
    },
    {
      label: "ACID transaction",
      language: "javascript",
      code: `const tx = await users.startTransaction();

await tx.insert({ name: 'Bob', age: 25 });
await tx.insert({ name: 'Cara', age: 31 });

// Write-ahead log + savepoint; recoverable after a crash
await tx.commit();`,
    },
    {
      label: "Run in Docker",
      language: "bash",
      code: `docker run -d --name axiodb-server \\
  -p 27018:27018 -p 27019:27019 \\
  -v axiodb-data:/app \\
  theankansaha/axiodb`,
    },
  ];

  // Isometric hexagon outlines forming the lattice behind the hero. Same geometry
  // family as nodejs.org's backdrop, flattened to a pointy-top grid.
  const HEX_LATTICE: string[] = (() => {
    const paths: string[] = [];
    const size = 26;
    const hStep = size * 1.5;
    const vStep = size * Math.sqrt(3);
    for (let col = 0; col < 26; col++) {
      for (let row = 0; row < 16; row++) {
        const cx = col * hStep;
        const cy = row * vStep + (col % 2 === 0 ? 0 : vStep / 2);
        const pts = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i;
          return `${(cx + size * Math.cos(angle)).toFixed(1)},${(cy + size * Math.sin(angle)).toFixed(1)}`;
        });
        paths.push(`M${pts.join("L")}Z`);
      }
    }
    return paths;
  })();

  const COMPETITOR_PROBLEMS = [
    {
      name: "LowDB",
      stars: "22.6k",
      status: "Stale",
      problems: [
        "No concurrency — concurrent writes corrupt data",
        "No ACID transactions — crash = data loss",
        "No built-in caching — full file rewrite every time",
        "Single JSON file — entire DB loaded into memory",
        "Last updated 3 years ago"
      ],
      icon: "📄"
    },
    {
      name: "NeDB",
      stars: "13.5k",
      status: "ABANDONED",
      problems: [
        "No longer maintained since 2016",
        "Data loss issues reported by users",
        "File corruption on concurrent access",
        "No TypeScript support",
        "Security vulnerabilities unpatched"
      ],
      icon: "💀"
    },
    {
      name: "better-sqlite3",
      stars: "11k+",
      status: "Active (but painful)",
      problems: [
        "Requires native C bindings compilation",
        "node-gyp headaches on every platform",
        "electron-rebuild required for Electron apps",
        "SQL strings instead of JavaScript objects",
        "Platform-specific builds (Windows ≠ Mac)"
      ],
      icon: "🔧"
    }
  ];

/** Tabbed code panel on the right of the hero, matching nodejs.org's sample. */
const HeroCodePanel: React.FC<{ tabs: { label: string; language: string; code: string }[] }> = ({ tabs }) => {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div className="border border-gray-200 rounded-[3px] overflow-hidden bg-white">
      <div
        className="flex flex-wrap border-b border-gray-200"
        role="tablist"
        aria-label="Code examples"
      >
        {tabs.map((item, index) => (
          <button
            key={item.label}
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={`flex-1 min-w-0 px-3 py-2.5 text-xs sm:text-sm truncate border-b-2 -mb-px transition-colors ${
              index === active
                ? "border-accent-600 text-gray-900 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
            title={item.label}
          >
            {item.label}
          </button>
        ))}
      </div>

      <CodeBlock code={tab.code} language={tab.language} />
    </div>
  );
};

const Introduction: React.FC = () => {
  const [totalDownloads, setTotalDownloads] = useState<number | null>(null);
  const [yearlyDownloads, setYearlyDownloads] = useState<number | null>(null);
  const [weeklyDownloads, setWeeklyDownloads] = useState<number | null>(null);
  const [monthlyDownloads, setMonthlyDownloads] = useState<number | null>(null);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(true);
  const [skillCopied, setSkillCopied] = useState(false);

  // Scroll-triggered reveal state for each below-the-fold section of the
  // page (see useScrollReveal). The hero itself animates immediately on
  // mount instead (it's already above the fold on load).
  const npmStatsReveal = useScrollReveal<HTMLDivElement>();
  const insertOpsReveal = useScrollReveal<HTMLDivElement>();
  const readOpsReveal = useScrollReveal<HTMLDivElement>();
  const updateDeleteReveal = useScrollReveal<HTMLDivElement>();
  const transactionReveal = useScrollReveal<HTMLDivElement>();
  const suiteReveal = useScrollReveal<HTMLDivElement>();
  const terminalReveal = useScrollReveal<HTMLDivElement>();
  const mcpBannerReveal = useScrollReveal<HTMLAnchorElement>();
  const skillBannerReveal = useScrollReveal<HTMLDivElement>();
  const cliBannerReveal = useScrollReveal<HTMLAnchorElement>();
  const desktopGuiBannerReveal = useScrollReveal<HTMLAnchorElement>();
  const cloudBannerReveal = useScrollReveal<HTMLDivElement>();
  const guiBannerReveal = useScrollReveal<HTMLDivElement>();
  const whyAxioDBReveal = useScrollReveal<HTMLDivElement>();
  const featureCardsReveal = useScrollReveal<HTMLDivElement>();
  const quoteReveal = useScrollReveal<HTMLDivElement>();
  const whatsNewReveal = useScrollReveal<HTMLDivElement>();
  const originStoryReveal = useScrollReveal<HTMLDivElement>();
  const competitorCalloutReveal = useScrollReveal<HTMLDivElement>();

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
    stars: githubApi.getBadgeUrl('stars')
  };

  const BADGES = [
    { src: badgeUrls.npm, alt: "npm version" },
    { src: "https://img.shields.io/npm/v/axiodb?logo=npm&label=npm", alt: "npm shields" },
    { src: "https://img.shields.io/npm/dt/axiodb.svg", alt: "npm downloads total" },
    { src: "https://img.shields.io/npm/dy/axiodb.svg", alt: "npm downloads yearly" },
    { src: "https://img.shields.io/npm/dw/axiodb.svg", alt: "npm downloads weekly" },
    { src: "https://img.shields.io/npm/dm/axiodb.svg", alt: "npm downloads monthly" },
    { src: "https://img.shields.io/npm/unpacked-size/axiodb?label=install%20size", alt: "install size" },
    { src: "https://img.shields.io/jsdelivr/npm/hm/axiodb?label=jsDelivr", alt: "jsDelivr hits" },
    { src: "https://img.shields.io/npm/types/axiodb?label=types", alt: "TypeScript types" },
    { src: "https://img.shields.io/badge/License-MIT-yellow.svg", alt: "License MIT" },
    { src: badgeUrls.codeql, alt: "CodeQL" },
    { src: badgeUrls.stars, alt: "GitHub Stars" },
    { src: "https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen", alt: "Node.js Version" },
    {
      src: "https://img.shields.io/badge/tested%20on-20%20%7C%2021%20%7C%2022%20%7C%2023%20%7C%2024%20%7C%2025%20%7C%2026-blue",
      alt: "Tested on Node.js",
    },
    { src: "https://img.shields.io/badge/Bun%20tested-v1.4.0-black?logo=bun", alt: "Bun tested v1.4.0" },
    { src: "https://img.shields.io/badge/Deno-partial%209%2F12-red", alt: "Deno partial support" },
    { src: "https://img.shields.io/badge/TypeScript-6.0-blue", alt: "TypeScript" },
    { src: "https://img.shields.io/badge/dependencies-0%20native-success", alt: "Zero native dependencies" },
  ];

  return (
    <section id="introduction" className="scroll-mt-20">
      <Seo
        title="AxioDB - The Embedded Database for Node.js | Introduction"
        description="Replaces SQLite, LowDB, NeDB and raw JSON files with a real database. Runs on Node.js 20+ and Bun. MongoDB-style queries, ACID transactions, zero native dependencies. No node-gyp, no electron-rebuild. Just npm install."
        path="/"
      />
      {/* Hero Section - two-column layout mirroring nodejs.org: headline,
          description and CTAs on the left; a tabbed code panel on the right,
          over the faint hexagonal backdrop. */}
      <div className="relative overflow-hidden bg-white rounded-[3px] p-5 sm:p-8 lg:p-12 mb-12 border border-gray-200 animate-fade-in">
        <div className="hex-backdrop" aria-hidden="true">
          <svg viewBox="0 0 1216 726" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="heroHexMask" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" width="1216" height="726" x="0" y="0">
                <rect width="1216" height="725.8" fill="url(#heroHexGrad)" />
              </mask>
              <radialGradient id="heroHexGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(608 363) scale(760 560)">
                <stop stopColor="white" stopOpacity="1" />
                <stop offset="1" stopColor="black" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g mask="url(#heroHexMask)" stroke="#5FA04E" strokeOpacity="0.28" strokeWidth="1">
              {HEX_LATTICE.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent-50 rounded-full border border-accent-200 mb-4">
                <span className="text-sm text-accent-700 font-medium">
                  Hello, Developer! Welcome to AxioDB
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal mb-6 text-gray-900 leading-[1.1] tracking-tight">
              The Embedded Database
              <br />
              for Node.js
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-xl mb-8">
              Replaces SQLite, LowDB, NeDB and raw JSON files with a real database.
              MongoDB-style queries, ACID transactions, zero native dependencies. No
              more <code className="font-mono text-accent-700">node-gyp</code> failures.
              No more <code className="font-mono text-accent-700">electron-rebuild</code>.
              Just <code className="font-mono text-accent-700">npm install</code>. Runs on
              Node.js 20+ and Bun — one codebase, same data files, no runtime lock-in.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/installation"
                className="inline-flex items-center justify-center px-6 py-3 rounded-[3px] bg-accent-600 text-white font-semibold hover:bg-accent-700 transition-colors"
              >
                Get AxioDB
              </Link>
              <Link
                to="/limitations"
                className="inline-flex flex-col items-center justify-center px-6 py-2.5 rounded-[3px] border border-gray-300 text-gray-700 hover:border-accent-500 hover:text-accent-700 transition-colors text-center"
              >
                <span>See the scope</span>
                <small className="text-xs text-gray-500">
                  when another database fits better
                </small>
              </Link>
            </div>
          </div>

          <HeroCodePanel tabs={HERO_TABS} />
        </div>
      </div>

      {/* Badges - wrapped into even rows on a centered strip, matching the
          partner tiles on nodejs.org, instead of one long scrolling line. */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {BADGES.map((badge) => (
          <img
            key={badge.alt}
            src={badge.src}
            alt={badge.alt}
            className="h-6 rounded-[3px]"
          />
        ))}
      </div>

          {/* Runtime Compatibility & Tested Cases */}
          <div className="bg-white border-2 border-gray-200 rounded-[3px] p-5 sm:p-6 mb-8 shadow-md">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-4">
              <span className="font-extrabold text-gray-900 text-lg">
                Runs on
              </span>
              <div className="flex items-center gap-2">
                <img
                  src="/logos/nodejs.svg"
                  alt="Node.js"
                  className="h-8 w-8"
                />
                <span className="text-gray-800 font-semibold">
                  Node.js{" "}
                  <span className="text-gray-500 font-normal">
                    ≥ v20 · officially supported
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src="/logos/bun.svg"
                  alt="Bun"
                  className="h-8 w-8"
                />
                <span className="text-gray-800 font-semibold">
                  Bun{" "}
                  <span className="text-gray-500 font-normal">
                    verified on v1.4.0
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-semibold text-gray-700 mr-1">
                Verified test cases:
              </span>
              {[
                "CRUD (insert / find / update / delete)",
                "Indexed queries",
                "ACID transactions",
                "Aggregation",
                "Worker threads — ≥100 files",
                "Worker threads — ≥10,000 docs"
              ].map((testCase) => (
                <span
                  key={testCase}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
                >
                  <Check className="h-3.5 w-3.5" />
                  {testCase}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              All 14 test suites — CRUD, transactions, reads, aggregation,
              auth, HTTP API, TCP (auth/no-auth/transaction/TLS), crash
              recovery, MCP, and cache options — pass on the machine's Node
              (v26.8.1) and Bun (v1.4.0), including the worker-thread data
              paths (reads of ≥100-file collections, searches over ≥10,000
              documents). Node 20+ is the supported baseline; Bun is verified on
              the installed v1.4.0 only. Deno passes 9/12 engine tests —
              worker threads are pending there.
            </p>
          </div>

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
              className={`flex items-center gap-3 bg-orange-50 px-5 py-3 rounded-[3px] border border-amber-200 shadow-sm hover:shadow-sm transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
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
              className={`flex items-center gap-3 bg-accent-50 px-5 py-3 rounded-[3px] border border-purple-200 shadow-sm hover:shadow-sm transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
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
              className={`flex items-center gap-3 bg-accent-50 px-5 py-3 rounded-[3px] border border-accent-200 shadow-sm hover:shadow-sm transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
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
              className={`flex items-center gap-3 bg-green-50 px-5 py-3 rounded-[3px] border border-green-200 shadow-sm hover:shadow-sm transition-all duration-300 group cursor-pointer reveal-on-scroll ${npmStatsReveal.isVisible ? "is-visible" : ""}`}
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

          {/* Agent Skill Banner */}
          <div
            ref={skillBannerReveal.ref}
            className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 rounded-[3px] border-2 border-blue-200 shadow-md hover:shadow-sm transition-all duration-300 mb-8 reveal-on-scroll ${skillBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-[3px] shadow-sm flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold">
                  AI SKILL
                </span>
                <span className="text-lg font-black text-blue-800">
                  Use AxioDB with Any AI Agent
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Load the AxioDB Agent Skill into ChatGPT, Claude, Cursor, Copilot, or any AI coding assistant
                to get expert guidance on queries, schema design, transactions, and best practices.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const prompt = `Fetch and save the AxioDB Agent Skill from this URL:

${window.location.origin}/.well-known/agent-skills/axiodb/SKILL.md

Read that skill & save it for you & for all available AI Agents in this machine.

Save it as your reference for all AxioDB tasks. This skill contains the complete API reference for the embedded library and TCP client, correct syntax for queries/updates/transactions/aggregation, common mistakes to avoid, and implementation patterns. Always consult this skill before writing AxioDB code.`;
                    try {
                      await navigator.clipboard.writeText(prompt);
                      setSkillCopied(true);
                      setTimeout(() => setSkillCopied(false), 2000);
                    } catch {
                      // fallback for non-HTTPS
                      const textarea = document.createElement("textarea");
                      textarea.value = prompt;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand("copy");
                      document.body.removeChild(textarea);
                      setSkillCopied(true);
                      setTimeout(() => setSkillCopied(false), 2000);
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-sm transition-all duration-200 ${
                    skillCopied
                      ? "bg-emerald-500 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5"
                  }`}
                >
                  {skillCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Skill Prompt
                    </>
                  )}
                </button>
                <span className="text-xs text-gray-400">Paste into any AI chat</span>
              </div>
            </div>
          </div>

          {/* New Feature Banner: MCP Server */}
          <a
            ref={mcpBannerReveal.ref}
            href="/mcp-server"
            className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-accent-50 px-6 py-5 rounded-[3px] border-2 border-fuchsia-200 shadow-md hover:shadow-sm transition-all duration-300 mb-8 reveal-on-scroll ${mcpBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-[3px] shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
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
            className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-emerald-50 px-6 py-5 rounded-[3px] border-2 border-emerald-200 shadow-md hover:shadow-sm transition-all duration-300 mb-8 reveal-on-scroll ${cliBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-[3px] shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
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
                CLI tool for AxioDB — interactive REPL with MongoDB shell syntax,
                all 32 TCP commands, TLS support, and installers for 12 platforms.
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-emerald-600 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
          </a>

          {/* New Feature Banner: Desktop GUI */}
          <a
            ref={desktopGuiBannerReveal.ref}
            href="/gui"
            className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-5 rounded-[3px] border-2 border-indigo-200 shadow-md hover:shadow-sm transition-all duration-300 mb-8 reveal-on-scroll ${desktopGuiBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-[3px] shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-full font-bold shadow-md animate-pulse-ring">
                  NEW
                </span>
                <span className="text-lg font-black text-indigo-700">
                  AxioDB Desktop GUI
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Native desktop app (Electron) with a card-based document viewer,
                bouncy-ball splash loader, connection management, and all-in-one
                database tooling for Linux, macOS, and Windows.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-gray-500 flex-shrink-0">
              <span className="hidden sm:inline">Linux · macOS · Windows</span>
              <ArrowRight className="h-6 w-6 text-indigo-600 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </a>
          <div className="mb-8">
            {/* ACID Compliance Banner */}
            <div className="flex items-center justify-center gap-3 bg-orange-50 px-6 py-4 rounded-[3px] border-2 border-amber-200 shadow-md mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-500 rounded-[3px] shadow-sm">
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
            <div className="bg-gray-50 rounded-[3px] p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600">Performance Benchmark</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-600">Tested: September 2026</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span>AMD Ryzen 5 5500U (6C/12T)</span>
                  <span>•</span>
                  <span>7.1 GB RAM</span>
                  <span>•</span>
                  <span>Ubuntu Linux 6.8.0</span>
                  <span>•</span>
                  <span>Node.js v26.8.1</span>
                  <span>•</span>
                  <span className="font-bold text-amber-700">100,000 documents dataset</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics Grid - Comprehensive */}
            
            {/* INSERT Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-accent-600 uppercase tracking-wider mb-2 px-1">Insert Operations</p>
              <div ref={insertOpsReveal.ref} className="grid grid-cols-2 md:grid-cols-3 gap-3 reveal-stagger-grid">
                <div className={`relative bg-accent-50 px-4 py-3 rounded-[3px] border border-accent-200 shadow-md hover:shadow-sm transition-all reveal-on-scroll ${insertOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-xl font-black text-accent-600">~31ms</span>
                    <p className="text-xs text-accent-600 font-semibold">Insert Single</p>
                  </div>
                </div>
                <div className={`relative bg-accent-50 px-4 py-3 rounded-[3px] border border-accent-200 shadow-md hover:shadow-sm transition-all reveal-on-scroll ${insertOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-xl font-black text-accent-600">~365ms</span>
                    <p className="text-xs text-accent-600 font-semibold">InsertMany (500)</p>
                  </div>
                </div>
                <div className={`relative bg-accent-50 px-4 py-3 rounded-[3px] border border-accent-200 shadow-md hover:shadow-sm transition-all reveal-on-scroll ${insertOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-xl font-black text-accent-600">&lt;1ms</span>
                    <p className="text-xs text-accent-600 font-semibold">Validation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* READ/QUERY Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 px-1">Read/Query Operations (100K docs)</p>
              <div ref={readOpsReveal.ref} className="grid grid-cols-3 md:grid-cols-6 gap-2 reveal-stagger-grid">
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-sm transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~1ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Indexed</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-sm transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~1ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">documentId</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-sm transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">&lt;1ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">findOne</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-sm transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~1.1s</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">$gt</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-sm transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~533ms</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">$in (5)</p>
                  </div>
                </div>
                <div className={`relative bg-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-sm transition-all reveal-on-scroll ${readOpsReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-emerald-600">~2.0s</span>
                    <p className="text-[10px] text-emerald-700 font-semibold">Regex</p>
                  </div>
                </div>
              </div>
            </div>

            {/* UPDATE & DELETE Operations */}
            <div ref={updateDeleteReveal.ref} className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 px-1">Update Operations</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 reveal-stagger-grid">
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-amber-200 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-700">~35ms</span>
                      <p className="text-[10px] text-amber-700 font-semibold">UpdateOne</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-amber-200 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-700">~326ms</span>
                      <p className="text-[10px] text-amber-700 font-semibold">UpdateMany</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-amber-200 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-amber-700">~2ms</span>
                      <p className="text-[10px] text-amber-700 font-semibold">Verify</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">Delete Operations</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 reveal-stagger-grid">
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-red-700 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-red-400">~28ms</span>
                      <p className="text-[10px] text-red-300 font-semibold">DeleteOne</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-red-700 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-red-400">~144ms</span>
                      <p className="text-[10px] text-red-300 font-semibold">DeleteMany</p>
                    </div>
                  </div>
                  <div className={`relative bg-orange-50 px-3 py-2 rounded-lg border border-red-700 shadow-sm reveal-on-scroll ${updateDeleteReveal.isVisible ? "is-visible" : ""}`}>
                    <div className="text-center">
                      <span className="text-lg font-black text-red-400">~53ms</span>
                      <p className="text-[10px] text-red-300 font-semibold">Verify</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TRANSACTION Operations */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2 px-1">Transaction Operations</p>
              <div ref={transactionReveal.ref} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 reveal-stagger-grid">
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~38ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Insert</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~32ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Update</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~44ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Delete</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~46ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">TX Mixed</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~8ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">Rollback</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~24ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">Savepoint</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~21ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">withTX</p>
                  </div>
                </div>
                <div className={`relative bg-violet-50 px-2 py-2 rounded-lg border border-violet-200 shadow-sm reveal-on-scroll ${transactionReveal.isVisible ? "is-visible" : ""}`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-violet-400">~20ms</span>
                    <p className="text-[10px] text-violet-300 font-semibold">Index Sync</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TEST SUITE OVERVIEW */}
            <div ref={suiteReveal.ref} className={`mb-4 reveal-on-scroll ${suiteReveal.isVisible ? "is-visible" : ""}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Test Suite Overview (100K docs - 14/14 Passing)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 reveal-stagger-grid">
                {[
                  { name: "CRUD", tests: 39, time: "4.1 s" },
                  { name: "Transactions", tests: 23, time: "681 ms" },
                  { name: "Read / Query", tests: 39, time: "24.5 s" },
                  { name: "Aggregation", tests: 63, time: "457 ms" },
                  { name: "Auth & RBAC", tests: 35, time: "6.1 s" },
                  { name: "HTTP API", tests: 47, time: "1.5 s" },
                  { name: "TCP Auth", tests: 25, time: "3.3 s" },
                  { name: "TCP No-Auth", tests: 5, time: "918 ms" },
                  { name: "TCP TX", tests: 22, time: "1.4 s" },
                  { name: "TCP TLS", tests: 3, time: "836 ms" },
                  { name: "Crash Recovery", tests: 3, time: "6.2 s" },
                  { name: "MCP Confirm", tests: 10, time: "49 ms" },
                  { name: "MCP Functional", tests: 4, time: "1.2 s" },
                  { name: "Cache Options", tests: 11, time: "1.4 s" },
                ].map((suite) => (
                  <div key={suite.name} className="bg-gray-50 px-2 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-sm transition-all text-center">
                    <p className="text-[10px] text-gray-500 font-semibold truncate">{suite.name}</p>
                    <span className="text-sm font-black text-gray-700">{suite.time}</span>
                    <p className="text-[9px] text-gray-400">{suite.tests} tests</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <a
                  href="/performance"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors"
                >
                  View full performance report
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Terminal Welcome Section - light panel to match the rest of the
              page, rather than a dark terminal island in a light layout. */}
          <div
            ref={terminalReveal.ref}
            className={`relative bg-gray-50 rounded-[3px] p-6 mb-8 shadow-sm border border-gray-200 overflow-hidden reveal-on-scroll ${terminalReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="absolute top-0 left-0 w-full h-4 bg-gray-200 flex items-center justify-start px-4 gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-500 ml-2">terminal</span>
            </div>
            <div className="pt-6 font-mono text-sm">
              <div className="text-accent-700 mb-2">$ npm install axiodb</div>
              <div className="text-gray-600 mb-3">+ axiodb@latest  # No native dependencies, no compilation</div>
              <div className="text-accent-700 mb-2">$ node app.js</div>
              <div className="text-gray-700 mb-1">✓ AxioDB initialized</div>
              <div className="text-gray-700 mb-1">✓ Database ready at ./AxioDB</div>
              <div className="text-gray-700 mb-3">✓ GUI available on localhost:27018</div>
              <div className="text-gray-600 mb-3">💡 Think SQLite, but NoSQL with JavaScript queries</div>
              <div className="text-gray-600 mb-4">🎯 Perfect for: Desktop apps • CLI tools • Node.js backends</div>
              <div className="flex items-center">
                <span className="text-accent-700">$</span>
                <span className="text-gray-900 ml-2 animate-pulse">Your embedded database is ready...</span>
                <span className="text-gray-900 ml-1 animate-ping">|</span>
              </div>
            </div>
          </div>

          {/* AxioDBCloud Promotional Banner - NEW! */}
          <div
            ref={cloudBannerReveal.ref}
            className={`relative overflow-hidden bg-gray-100 rounded-lg p-8 mb-8 shadow-sm border-2 border-accent-500 reveal-on-scroll ${cloudBannerReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/30 shadow-sm">
                    <Cloud className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold mb-3 animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    NEW FEATURE
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-2xl font-extrabold text-gray-900 mb-3">
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
                      className="inline-flex items-center gap-2 bg-white text-accent-600 px-6 py-3 rounded-lg font-bold hover:bg-accent-50 shadow-sm hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-200"
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
            className={`bg-accent-50 text-gray-900 rounded-[3px] p-6 mb-8 border border-accent-200 shadow-sm reveal-on-scroll ${guiBannerReveal.isVisible ? "is-visible" : ""}`}
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
                    Built-in GUI
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
                  className="inline-flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-700 transition-colors shadow-sm hover:shadow-sm"
                >
                  <Code className="h-4 w-4" />
                  View GUI Documentation
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Origin Story Section */}
          <div
            ref={originStoryReveal.ref}
            className={`relative bg-gradient-to-br from-gray-50 to-accent-50 rounded-[3px] p-6 sm:p-8 mb-8 border border-gray-200 shadow-sm reveal-on-scroll ${originStoryReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📖</span>
              <span className="text-sm bg-accent-100 text-accent-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">Our Story</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
              Born from SQLite Pain. Built to Be Better.
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p className="text-lg">
                It started with a simple error: <code className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 font-mono text-sm">node-gyp ERR!</code>
                <span className="text-red-600 font-semibold"> — again.</span>
              </p>
              <p>
                We were building an Electron app. Needed a database. Tried <strong>better-sqlite3</strong> —
                <span className="text-red-500"> node-gyp compilation failed</span>. Tried <strong>LowDB</strong> —
                <span className="text-red-500"> data corrupted on concurrent writes</span>. Tried <strong>NeDB</strong> —
                <span className="text-red-500"> abandoned since 2016</span>.
              </p>
              <p className="font-semibold text-gray-700">
                So we built AxioDB.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <span className="text-green-500 text-lg mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-gray-700">Zero native dependencies</span>
                    <p className="text-sm text-gray-500">No node-gyp, no electron-rebuild, no platform headaches</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <span className="text-green-500 text-lg mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-gray-700">ACID transactions</span>
                    <p className="text-sm text-gray-500">Crash recovery, savepoints, write-ahead logging</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <span className="text-green-500 text-lg mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-gray-700">MongoDB-style queries</span>
                    <p className="text-sm text-gray-500">JavaScript objects, not SQL strings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <span className="text-green-500 text-lg mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-gray-700">Built-in caching & GUI</span>
                    <p className="text-sm text-gray-500">InMemoryCache + web dashboard included</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Still Using This? Competitor Callout */}
          <div
            ref={competitorCalloutReveal.ref}
            className={`relative bg-gradient-to-br from-red-50 to-orange-50 rounded-[3px] p-6 sm:p-8 mb-8 border-2 border-red-200 shadow-sm reveal-on-scroll ${competitorCalloutReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="text-center mb-6">
              <span className="text-3xl mb-3 block">🤔</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                Still Using LowDB, NeDB, or better-sqlite3?
              </h2>
              <p className="text-gray-600 text-lg">
                Here's what developers actually deal with every day:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {COMPETITOR_PROBLEMS.map((competitor) => (
                <div key={competitor.name} className="bg-white rounded-[3px] p-5 border border-gray-200 shadow-md hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{competitor.icon}</span>
                      <span className="font-bold text-gray-900">{competitor.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      competitor.status === "ABANDONED" ? "bg-red-100 text-red-700" :
                      competitor.status === "Stale" ? "bg-orange-100 text-orange-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {competitor.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">{competitor.stars} GitHub stars</div>
                  <ul className="space-y-2">
                    {competitor.problems.map((problem, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span>{problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 mb-4">
                AxioDB solves all of these problems:
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">✓ ACID Transactions</span>
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">✓ Zero Native Deps</span>
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">✓ Active Maintenance</span>
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">✓ InMemoryCache</span>
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">✓ TypeScript 6.0</span>
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">✓ Built-in GUI</span>
              </div>
              <a
                href="/comparison"
                className="inline-flex items-center gap-2 bg-accent-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-accent-700 transition-all shadow-sm hover:shadow-sm transform hover:-translate-y-0.5"
              >
                See Full Comparison
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

      {/* Executive Overview */}
      <div
        ref={whyAxioDBReveal.ref}
        className={`relative bg-gray-50 rounded-[3px] p-5 sm:p-8 lg:p-12 mb-16 border border-gray-200 shadow-sm reveal-on-scroll ${whyAxioDBReveal.isVisible ? "is-visible" : ""}`}
      >
        <div className="w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why AxioDB?
          </h2>
          <p className="text-lg lg:text-xl leading-relaxed text-gray-600 mb-8 max-w-4xl">
            SQLite requires native C bindings that cause deployment headaches. JSON files have no
            querying or caching. MongoDB needs a separate server. AxioDB combines the best of all:
            embedded like SQLite, NoSQL queries like MongoDB, intelligent caching built-in.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-base">
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
              <div className={`space-y-2 reveal-on-scroll ${whyAxioDBReveal.isVisible ? "is-visible" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700">
                    ACID Transactions
                  </span>
                </div>
                <p className="text-gray-600 ml-4">
                  Commit, rollback and savepoints over a write-ahead log, with crash
                  recovery — not something you bolt on later.
                </p>
              </div>
            </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div ref={featureCardsReveal.ref} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 reveal-stagger-grid">
        <div className={`group relative bg-white rounded-lg shadow-sm hover:shadow-sm transition-all duration-300 p-8 border border-gray-200 hover:border-orange-200 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-500 rounded-[3px] shadow-sm group-hover:shadow-sm transition-shadow">
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

        <div className={`group relative bg-white rounded-lg shadow-sm hover:shadow-sm transition-all duration-300 p-8 border border-gray-200 hover:border-accent-600 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent-500 rounded-[3px] shadow-sm group-hover:shadow-sm transition-shadow">
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

        <div className={`group relative bg-white rounded-lg shadow-sm hover:shadow-sm transition-all duration-300 p-8 border border-gray-200 hover:border-green-200 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-[3px] shadow-sm group-hover:shadow-sm transition-shadow">
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

        <div className={`group relative bg-white rounded-lg shadow-sm hover:shadow-sm transition-all duration-300 p-8 border border-gray-200 hover:border-purple-200 transform hover:-translate-y-1 reveal-on-scroll ${featureCardsReveal.isVisible ? "is-visible" : ""}`}>
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500 rounded-[3px] shadow-sm group-hover:shadow-sm transition-shadow">
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

      {/* What's New Section */}
      <div
        ref={whatsNewReveal.ref}
        className={`relative mb-16 reveal-on-scroll ${whatsNewReveal.isVisible ? "is-visible animate-fade-in-up" : ""}`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 border border-accent-200 rounded-full text-xs font-semibold uppercase tracking-wide text-accent-700 mb-4">
          What's New
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          AdminPassword — set the admin password at startup
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-4xl">
          The seeded <code className="font-mono">admin/admin</code> account is flagged{" "}
          <code className="font-mono">mustChangePassword</code>, and only the HTTP API or GUI can
          clear that flag. Start the server with the GUI disabled and there was no way to choose a
          password — TCP rejected every login and nothing could recover it.{" "}
          <code className="font-mono">AdminPassword</code> closes that gap.
        </p>

        {/* How to set it, per surface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-[3px] p-5">
            <h3 className="font-semibold text-gray-900 mb-3">In your app</h3>
            <CodeBlock
              language="javascript"
              code={`const db = new AxioDB({
  TCP: true,
  TCPAuth: true,
  GUI: false,
  AdminPassword: 'my-secret-password',
});`}
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-[3px] p-5">
            <h3 className="font-semibold text-gray-900 mb-3">In the CLI</h3>
            <CodeBlock
              language="bash"
              code={`axiodb serve tcp-auth my-secret-password
axiodb serve full my-secret-password`}
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-[3px] p-5">
            <h3 className="font-semibold text-gray-900 mb-3">In Docker</h3>
            <CodeBlock
              language="bash"
              code={`docker run -d \\
  -e AXIODB_GUI=false \\
  -e AXIODB_ADMIN_PASSWORD=my-secret-password \\
  theankansaha/axiodb`}
            />
          </div>
        </div>

        {/* What it guarantees, plus the fail-fast rules it now backs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 border border-gray-200 rounded-[3px] p-5">
            <h3 className="font-semibold text-gray-900 mb-3">What you get</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>One account across embedded, HTTP, GUI, TCP, MCP and the CLI — they all read the same <code className="font-mono">config</code> database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Sets <code className="font-mono">mustChangePassword: false</code>, so logins work immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Read on first start only — a container restart never resets a password you have since changed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Additive: omit it and the <code className="font-mono">admin/admin</code> + forced-change behaviour is unchanged</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-[3px] p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Now enforced, not just documented</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">!</span>
                <span><code className="font-mono">axiodb serve tcp-auth</code> <strong>requires</strong> a password and exits without one</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">!</span>
                <span>The Docker image refuses to start when TCP auth is on, <code className="font-mono">AXIODB_HTTP</code> is off and no password is set</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">—</span>
                <span><code className="font-mono">http</code> and <code className="font-mono">full</code> keep it optional: their control server can rotate the password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">—</span>
                <span><Link to="/create-database" className="underline">Full option reference →</Link></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Introduction;
