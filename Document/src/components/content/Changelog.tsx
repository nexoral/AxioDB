import React from "react";
import Seo from "../ui/Seo";
import { History, Tag } from "lucide-react";
import { changelog } from "../../data/changelog";

const Changelog: React.FC = () => {
  return (
    <div className="space-y-12">
      <Seo
        title="Changelog | AxioDB Documentation"
        description="Every major AxioDB release from day one - versions, dates, and what actually changed."
        path="/changelog"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 border border-violet-200 dark:border-violet-700 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 rounded-full border border-violet-300 dark:border-violet-600 mb-6">
            <History className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="text-violet-700 dark:text-violet-300 font-semibold">
              SEE HOW AXIODB HAS EVOLVED
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
            Changelog
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Every major milestone in AxioDB's history, from the very first commit onward.
            This is a curated list of what actually changed - not every commit or patch bump,
            just the releases that shipped something meaningful.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-6">
        {changelog.map((entry, index) => (
          <div
            key={`${entry.version}-${entry.date}-${index}`}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                <Tag className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                  v{entry.version}
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {entry.date}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              {entry.title}
            </h3>
            <ul className="space-y-1.5">
              {entry.changes.map((change, changeIndex) => (
                <li
                  key={changeIndex}
                  className="text-slate-700 dark:text-slate-300 text-sm flex gap-2"
                >
                  <span className="text-violet-500 dark:text-violet-400 mt-0.5">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Changelog;
