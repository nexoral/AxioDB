import React from "react";
import { Helmet } from "react-helmet";

const WhyChooseAxioDBPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Why Choose AxioDB - AxioDB Documentation</title>
        <meta
          name="description"
          content="Learn about the internal working mechanisms of AxioDB and its advantages for Node.js developers"
        />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <h1 id="why-choose-axiodb" className="text-3xl font-bold mb-6">
          Why Choose AxioDB
        </h1>

        <p className="mb-6">
          AxioDB offers several unique advantages for Node.js developers looking
          for an efficient, secure, and performance-oriented database solution.
          This page explains the internal mechanisms that make AxioDB stand out
          from other database options.
        </p>

        <section className="mb-10">
          <h2 id="tree-structure" className="text-2xl font-semibold mb-4">
            Tree Structure for Fast Data Retrieval
          </h2>
          <p className="mb-4">
            At the core of AxioDB is an optimized tree-based data structure that
            enables lightning-fast data lookups and queries. Unlike traditional
            databases that might require full table scans, AxioDB's tree
            architecture ensures:
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6 overflow-auto">
            <pre className="text-sm font-mono">
              {`                     Root
                   /  |  \\
                  /   |   \\
             Node A  Node B  Node C
             /  \\     |     /  |  \\
           ...  ...   ...  ... ... ...
           
           Document Tree Structure
           - Each node contains indexed properties
           - Logarithmic search complexity
           - Balanced for optimal traversal`}
            </pre>
          </div>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Logarithmic time complexity</strong>: As your data grows,
              query time increases only logarithmically, not linearly
            </li>
            <li>
              <strong>Efficient indexing</strong>: The tree structure
              automatically serves as an index, reducing the need for separate
              index maintenance
            </li>
            <li>
              <strong>Optimized for both reads and writes</strong>: The balanced
              tree structure ensures consistent performance for both data
              retrieval and insertion operations
            </li>
          </ul>
          <p className="mb-4">
            For Node.js developers, this means your applications remain
            responsive even as your data scales, without requiring extensive
            query optimization or complex index management.
          </p>
        </section>

        <section className="mb-10">
          <h2 id="worker-threads" className="text-2xl font-semibold mb-4">
            Worker Threads for Parallel Processing
          </h2>
          <p className="mb-4">
            AxioDB leverages Node.js Worker Threads to parallelize read
            operations, bringing several advantages:
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6 overflow-auto">
            <pre className="text-sm font-mono">
              {`                Main Process
                ─────────────
                      │
    ┌─────────────────┼──────────────────┐
    │                 │                  │
 Worker 1         Worker 2           Worker N
 (2.5k files)    (2.5k files)        (2.5k files)
    │                 │                  │
   read()           read()             read()
  file-by-file     file-by-file      file-by-file
    │                 │                  │
    └─────────────────┼──────────────────┘
                      │
                 Merge Results
                      │
                Return to Client`}
            </pre>
          </div>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Non-blocking I/O</strong>: Database operations don't block
              your application's event loop
            </li>
            <li>
              <strong>Multi-core utilization</strong>: Takes advantage of all
              available CPU cores for data processing tasks
            </li>
            <li>
              <strong>Scalable performance</strong>: Read operations scale with
              available system resources
            </li>
            <li>
              <strong>Responsive applications</strong>: Prevents long-running
              queries from causing application-wide slowdowns
            </li>
          </ul>
          <p className="mb-4">
            This multi-threaded approach is especially valuable in Node.js
            environments, where efficiently handling CPU-intensive tasks
            alongside I/O operations has traditionally been challenging.
          </p>
        </section>

        <section className="mb-10">
          <h2 id="data-storage" className="text-2xl font-semibold mb-4">
            Data Storage Architecture
          </h2>
          <p className="mb-4">
            AxioDB employs a file-based storage system with intelligent
            organization to maintain performance even as collections grow:
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6 overflow-auto">
            <pre className="text-sm font-mono">
              {`   Database Root
        │
        ├── Collection A/
        │   ├── .{document-id-1}.axio  ◄── Individual document files
        │   ├── .{document-id-2}.axio      with unique IDs as filenames
        │   └── .{document-id-n}.axio
        │
        ├── Collection B/
        │   ├── .{document-id-1}.axio
        │   ├── .{document-id-2}.axio
        │   └── .{document-id-n}.axio
        │
        └── metadata.json  ◄── Database configuration and schema information`}
            </pre>
          </div>

          <p className="mb-4">
            This storage architecture provides several advantages:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Document isolation</strong>: Each document is stored in
              its own file, preventing write conflicts
            </li>
            <li>
              <strong>Selective loading</strong>: Only the documents you need
              are loaded into memory
            </li>
            <li>
              <strong>File-level locking</strong>: Prevents concurrent
              modifications while allowing parallel reads
            </li>
            <li>
              <strong>Easy backup</strong>: Simple to back up individual
              collections or documents
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 id="two-pointer" className="text-2xl font-semibold mb-4">
            Two-Pointer Searching Algorithm
          </h2>
          <p className="mb-4">
            AxioDB implements an optimized two-pointer searching algorithm that:
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6 overflow-auto">
            <pre className="text-sm font-mono">
              {`  Data Array: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
               ↑                             ↑
              left                         right
              
  Two-Pointer Search (looking for values that sum to 11)
  
  Step 1: Check left and right positions: 1 + 10 = 11 ✓
          Record match, move both pointers
  
  Step 2: left++, right--
          [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
               ↑                       ↑
             Check: 2 + 9 = 11 ✓
  
  Each step traverses from both ends simultaneously, 
  allowing efficient checks with fewer iterations.`}
            </pre>
          </div>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Minimizes memory usage</strong>: The algorithm traverses
              data structures efficiently without loading entire datasets into
              memory
            </li>
            <li>
              <strong>Reduces computational overhead</strong>: Eliminates
              redundant comparisons and optimizes the search path
            </li>
            <li>
              <strong>Enables range queries</strong>: Naturally supports
              efficient range-based searches and filtered queries
            </li>
            <li>
              <strong>Works seamlessly with the tree structure</strong>:
              Combined with the tree architecture, delivers sub-linear search
              times even on large datasets
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 id="query-processing" className="text-2xl font-semibold mb-4">
            Query Processing Pipeline
          </h2>
          <p className="mb-4">
            When you execute a query in AxioDB, it goes through an optimized
            pipeline that maximizes performance:
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6 overflow-auto">
            <pre className="text-sm font-mono">
              {`  Client Query
      │
      ▼
  Parse Query ────────────────────┐
      │                           │
      ▼                           ▼
  Check Cache ──► Cache Hit ──► Return Results
      │
      ▼ Cache Miss
  Distribute to Workers
      │
      ├──────────┬──────────┬──────────┐
      ▼          ▼          ▼          ▼
  Worker 1    Worker 2    Worker 3    Worker N
      │          │          │          │
      ├──────────┴──────────┴──────────┘
      ▼
  Aggregate Results
      │
      ▼
  Apply Sorting/Limiting
      │
      ▼
  Cache Results
      │
      ▼
  Return to Client`}
            </pre>
          </div>

          <p className="mb-4">
            This pipeline architecture provides several key benefits:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Intelligent caching</strong>: Frequently accessed queries
              are cached for instant retrieval
            </li>
            <li>
              <strong>Parallelized processing</strong>: Work is distributed
              across multiple threads for maximum throughput
            </li>
            <li>
              <strong>Lazy evaluation</strong>: Results are processed
              incrementally when possible to reduce memory usage
            </li>
            <li>
              <strong>Just-in-time compilation</strong>: Query patterns are
              optimized during runtime for faster subsequent execution
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 id="single-instance" className="text-2xl font-semibold mb-4">
            Single Instance Architecture for Data Security & Consistency
          </h2>
          <p className="mb-4">
            AxioDB employs a single instance architecture that provides:
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6 overflow-auto">
            <pre className="text-sm font-mono">
              {`                  ┌───────────────────────────┐
                  │    AxioDB Single Instance  │
                  │                            │
  ┌─────────┐     │   ┌─────────────────────┐  │
  │ Client 1 │◄────►  │                     │  │
  └─────────┘     │   │                     │  │
                  │   │   Consistent Data   │  │
  ┌─────────┐     │   │        Store        │  │
  │ Client 2 │◄────►  │                     │  │
  └─────────┘     │   │                     │  │
                  │   └─────────────────────┘  │
  ┌─────────┐     │            │ │             │
  │ Client 3 │◄────►           │ │             │
  └─────────┘     │    ┌───────┘ └────────┐    │
                  │    │                  │    │
                  │ ┌──▼───┐          ┌──▼───┐ │
                  │ │ Read │          │Write │ │
                  │ │Queue │          │Queue │ │
                  │ └──────┘          └──────┘ │
                  └───────────────────────────┘`}
            </pre>
          </div>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>ACID compliance</strong>: All operations are Atomic,
              Consistent, Isolated, and Durable
            </li>
            <li>
              <strong>Simplified deployment</strong>: No cluster configuration
              or coordination required
            </li>
            <li>
              <strong>Stronger data consistency</strong>: Eliminates eventual
              consistency issues common in distributed databases
            </li>
            <li>
              <strong>Lower operational overhead</strong>: Reduced complexity
              means fewer points of failure and easier troubleshooting
            </li>
          </ul>
          <p className="mb-4">
            This architecture is particularly beneficial for Node.js
            applications where data integrity and predictable behavior are
            critical, such as financial applications, user authentication
            systems, or any scenario where data corruption would be
            catastrophic.
          </p>
        </section>

        <section className="mb-10">
          <h2 id="developer-experience" className="text-2xl font-semibold mb-4">
            Designed for Node.js Developers
          </h2>
          <p className="mb-4">
            Beyond its technical advantages, AxioDB was built specifically for
            Node.js developers:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Native JavaScript API</strong>: Work with familiar syntax
              and data structures
            </li>
            <li>
              <strong>Promise-based interface</strong>: Integrates smoothly with
              async/await patterns
            </li>
            <li>
              <strong>Lightweight dependency</strong>: Minimal impact on your
              application's bundle size
            </li>
            <li>
              <strong>Simple learning curve</strong>: If you know JavaScript
              objects, you already understand much of how to work with AxioDB
            </li>
          </ul>
          <p>
            Whether you're building a small personal project or a large-scale
            production application, AxioDB offers the performance, reliability,
            and developer experience needed to make your Node.js applications
            succeed.
          </p>
        </section>
      </div>
    </>
  );
};

export default WhyChooseAxioDBPage;
