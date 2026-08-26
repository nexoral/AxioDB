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
      <div className="relative overflow-hidden bg-white rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-gray-200 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <FilterX className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                Limitations & Scale Considerations
              </h1>
              <p className="text-xl text-gray-600 font-light mt-2">
                Understanding AxioDB's design scope
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            AxioDB is designed for embedded applications with 10K-500K documents.
            For different requirements, consider these alternatives.
          </p>
        </div>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-sm mb-8">
        <h3 className="text-xl font-semibold text-orange-700 mb-4">
          Scale & Performance Boundaries
        </h3>

        <ul className="space-y-4 text-gray-600">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Dataset Size:
              </strong>{" "}
              Optimized for 10K-500K documents. For 10M+ documents, use PostgreSQL,
              MongoDB, or SQLite which are designed for massive scale.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Disk Usage per Document:
              </strong>{" "}
              AxioDB stores one file per document, and a filesystem allocates whole
              blocks &mdash; typically 4&nbsp;KB. A 128-byte document therefore occupies
              4&nbsp;KB on disk. Measured on ext4, 20,000 documents of ~130 bytes used{" "}
              <strong className="text-gray-700">80&nbsp;MB for 2.6&nbsp;MB of data</strong>{" "}
              (31&times; amplification). The waste shrinks as documents grow and disappears
              around 4&nbsp;KB each, so budget ~4&nbsp;KB per document when storing many
              small records. In exchange, <code className="text-orange-700">documentId</code>{" "}
              lookups are O(1) with no index consulted, and a torn write can only ever
              damage one document.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Unindexed Scans:
              </strong>{" "}
              A query that is not a <code className="text-orange-700">documentId</code>{" "}
              lookup or an exact match on an indexed field reads every document in the
              collection &mdash; one file open per document rather than a single
              sequential read. On the same 20,000 documents a full scan measured
              208&nbsp;ms against 20&nbsp;ms for an equivalent single-file format. Index
              the fields you filter on; the cost grows with collection size.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Concurrency:
              </strong>{" "}
              Single-instance architecture. For multi-user web applications with
              hundreds of concurrent connections, use traditional client-server databases.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Relational Data:
              </strong>{" "}
              Document-based NoSQL architecture. No JOIN operations. For complex
              relational data with foreign keys and constraints, use SQL databases.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Distributed Systems:
              </strong>{" "}
              Single-node only. No replication, no sharding, no clustering. For
              distributed systems, use MongoDB or CouchDB.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-3"></div>
            <div>
              <strong className="text-gray-700">
                Transactions:
              </strong>{" "}
              No ACID transactions across multiple collections. For transaction
              requirements, use PostgreSQL or MongoDB with transactions enabled.
            </div>
          </li>
        </ul>

        <div className="mt-6 p-4 bg-accent-100/30 rounded-lg">
          <p className="text-gray-600 leading-relaxed">
            <strong className="text-accent-700">
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
