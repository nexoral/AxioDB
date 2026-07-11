import { FilterX } from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";

const Limitations: React.FC = () => {
  return (
    <section id="limitations" className="pt-12 scroll-mt-20">
      <Seo
        title="Limitations & Scale Considerations | AxioDB Documentation"
        description="Understand AxioDB's design scope: optimized for 10K-500K documents, single-instance, single-collection transactions - and when to use PostgreSQL or MongoDB instead."
        path="/limitations"
      />
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-900/20 dark:via-slate-800 dark:to-red-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-orange-200 dark:border-orange-800 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
              <FilterX className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-800 via-red-700 to-pink-700 dark:from-orange-200 dark:via-red-300 dark:to-pink-200 bg-clip-text text-transparent">
                Limitations & Scale Considerations
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                Understanding AxioDB's design scope
              </p>
            </div>
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            AxioDB is designed for embedded applications with 10K-500K documents.
            For different requirements, consider these alternatives.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-sm mb-8">
        <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-4">
          Scale & Performance Boundaries
        </h3>

        <ul className="space-y-4 text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-slate-800 dark:text-slate-200">
                Dataset Size:
              </strong>{" "}
              Optimized for 10K-500K documents. For 10M+ documents, use PostgreSQL,
              MongoDB, or SQLite which are designed for massive scale.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-slate-800 dark:text-slate-200">
                Concurrency:
              </strong>{" "}
              Single-instance architecture. For multi-user web applications with
              hundreds of concurrent connections, use traditional client-server databases.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-slate-800 dark:text-slate-200">
                Relational Data:
              </strong>{" "}
              Document-based NoSQL architecture. No JOIN operations. For complex
              relational data with foreign keys and constraints, use SQL databases.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-slate-800 dark:text-slate-200">
                Distributed Systems:
              </strong>{" "}
              Single-node only. No replication, no sharding, no clustering. For
              distributed systems, use MongoDB or CouchDB.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-slate-800 dark:text-slate-200">
                Transactions:
              </strong>{" "}
              No ACID transactions across multiple collections. For transaction
              requirements, use PostgreSQL or MongoDB with transactions enabled.
            </div>
          </li>
        </ul>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-blue-800 dark:text-blue-200">
              When to Use AxioDB:
            </strong>{" "}
            Desktop apps, CLI tools, embedded systems, prototyping, and local-first
            applications with moderate data needs. Think SQLite-scale with MongoDB-style
            queries and built-in caching.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Limitations;
