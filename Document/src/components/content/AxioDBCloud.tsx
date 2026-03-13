import React, { useEffect } from "react";
import { React as Service } from "react-caches";
import CodeBlock from "../ui/CodeBlock";
import {
  Cloud,
  Server,
  Zap,
  Shield,
  RefreshCw,
  Activity,
  Globe,
  CheckCircle,
  ArrowRight,
  Package,
  Terminal,
  Code2,
  Network,
} from "lucide-react";

const AxioDBCloud: React.FC = () => {
  useEffect(() => {
    Service.UpdateDocumentTitle(
      "AxioDBCloud - Remote Database Access | AxioDB Documentation"
    );
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 border border-blue-200 dark:border-blue-700 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full border border-blue-300 dark:border-blue-600 mb-6">
            <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              NEW FEATURE
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            AxioDBCloud
          </h1>

          <p className="text-2xl lg:text-3xl text-slate-700 dark:text-slate-200 font-medium mb-4">
            Remote Database Access Made Simple
          </p>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Deploy AxioDB in Docker or Cloud. Connect from anywhere with the same API you already know.
            Zero code changes, production-ready TCP protocol, automatic reconnection.
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          Why AxioDBCloud?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Zero Code Changes
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Use the exact same API as embedded AxioDB. Just change from <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">new AxioDB()</code> to <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">new AxioDBCloud()</code>
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Deploy Anywhere
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Docker, AWS, Azure, Google Cloud, DigitalOcean, or your own servers. One instance, unlimited clients.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Auto-Reconnect
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Built-in exponential backoff reconnection. Up to 10 retry attempts. Your app stays resilient.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Production Ready
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              1000+ concurrent connections, heartbeat monitoring, request correlation, connection pooling.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start - Server */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Server className="h-8 w-8 text-blue-500" />
          Server Setup
        </h2>

        <div className="space-y-6">
          {/* Docker Method */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-blue-500" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Option 1: Docker (Recommended)
              </h3>
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-4">
              The easiest way to deploy AxioDB with TCP access:
            </p>

            <CodeBlock
              language="bash"
              code={`# Pull and run the AxioDB Docker container
docker run -d \\
  --name axiodb-server \\
  -p 27018:27018 \\
  -p 27019:27019 \\
  -v axiodb-data:/app \\
  theankansaha/axiodb

# Ports:
# 27018 - HTTP GUI Dashboard
# 27019 - TCP Remote Access (AxioDBCloud)

# Your AxioDB server is now running!
# TCP: axiodb://localhost:27019
# GUI: http://localhost:27018`}
            />

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">-v</code> to persist data across container restarts.
              </p>
            </div>
          </div>

          {/* Node.js Method */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="h-6 w-6 text-green-500" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Option 2: Node.js Application
              </h3>
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Start TCP server programmatically:
            </p>

            <CodeBlock
              language="javascript"
              code={`const { AxioDB } = require('axiodb');

// Create AxioDB instance with TCP enabled
const db = new AxioDB(
  false,              // GUI (optional)
  'MyDatabase',       // Root database name
  './data',           // Data directory
  true                // Enable TCP server
);

// Server automatically starts on port 27019
console.log('AxioDB TCP Server running on port 27019');`}
            />

            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Default Port:</strong> TCP server listens on port <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded">27019</code> (HTTP GUI uses 27018).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Usage */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Globe className="h-8 w-8 text-purple-500" />
          Client Usage
        </h2>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Basic Connection
            </h3>

            <CodeBlock
              language="javascript"
              code={`const { AxioDBCloud } = require('axiodb');

// Connect to remote AxioDB server
const client = new AxioDBCloud("axiodb://localhost:27019");

// Establish connection
await client.connect();

// Use exactly like embedded AxioDB!
const db = await client.createDB("ProductionDB");
const users = await db.createCollection("Users");

// All operations work identically
await users.insert({ name: "Alice", email: "alice@example.com" });

const results = await users.query({ name: "Alice" })
  .Limit(10)
  .Skip(0)
  .Sort({ createdAt: -1 })
  .exec();

console.log(results);

// Disconnect when done
await client.disconnect();`}
            />
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-2">
              Connection String Format
            </h4>
            <code className="text-sm text-purple-800 dark:text-purple-300">
              axiodb://[host]:[port]
            </code>
            <ul className="mt-2 text-sm text-purple-800 dark:text-purple-300 space-y-1">
              <li>• Local: <code>axiodb://localhost:27019</code></li>
              <li>• Remote: <code>axiodb://192.168.1.100:27019</code></li>
              <li>• Cloud: <code>axiodb://mydb.example.com:27019</code></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Advanced Options
            </h3>

            <CodeBlock
              language="javascript"
              code={`const client = new AxioDBCloud("axiodb://localhost:27019", {
  timeout: 30000,           // Request timeout (ms)
  reconnectAttempts: 10,    // Max reconnect attempts
  reconnectDelay: 1000,     // Initial delay (ms)
  heartbeatInterval: 30000  // Heartbeat every 30s
});`}
            />
          </div>
        </div>
      </section>

      {/* Complete API Examples */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Code2 className="h-8 w-8 text-indigo-500" />
          Complete API Examples
        </h2>

        <div className="space-y-6">
          {/* CRUD Operations */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              CRUD Operations
            </h3>

            <CodeBlock
              language="javascript"
              code={`// Insert single document
await users.insert({ name: "Bob", age: 30 });

// Insert multiple documents
await users.insertMany([
  { name: "Charlie", age: 25 },
  { name: "Diana", age: 28 }
]);

// Query documents
const adults = await users.query({ age: { $gte: 18 } })
  .Limit(10)
  .Sort({ age: -1 })
  .exec();

// Update document
await users.update({ name: "Bob" }).UpdateOne({ age: 31 });

// Delete document
await users.delete({ name: "Charlie" }).deleteOne();

// Aggregation
const stats = await users.aggregate([
  { $match: { age: { $gte: 25 } } },
  { $group: { _id: null, avgAge: { $avg: "$age" } } }
]).exec();`}
            />
          </div>

          {/* Real-world Example */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Real-World Example: E-commerce App
            </h3>

            <CodeBlock
              language="javascript"
              code={`const { AxioDBCloud } = require('axiodb');

async function main() {
  // Connect to production database
  const client = new AxioDBCloud("axiodb://prod.example.com:27019");
  await client.connect();

  const db = await client.createDB("EcommerceDB");
  const products = await db.createCollection("Products");
  const orders = await db.createCollection("Orders");

  // Add new product
  await products.insert({
    sku: "LAPTOP-001",
    name: "Gaming Laptop",
    price: 1299.99,
    stock: 15,
    category: "Electronics"
  });

  // Get low stock products
  const lowStock = await products.query({ stock: { $lt: 10 } })
    .Sort({ stock: 1 })
    .exec();

  console.log("Low stock products:", lowStock.data.documents);

  // Create order
  await orders.insert({
    orderId: "ORD-12345",
    customerId: "USER-001",
    items: [{ sku: "LAPTOP-001", quantity: 1 }],
    total: 1299.99,
    status: "pending"
  });

  // Get today's orders
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = await orders.query({
    createdAt: { $regex: today }
  }).exec();

  console.log("Today's orders:", todayOrders.data.documents.length);

  await client.disconnect();
}

main().catch(console.error);`}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-green-500" />
          Features & Capabilities
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: CheckCircle, title: "35+ Commands", desc: "Full CRUD, aggregation, indexing support" },
            { icon: RefreshCw, title: "Auto-Reconnect", desc: "Exponential backoff with 10 retry attempts" },
            { icon: Activity, title: "Heartbeat", desc: "PING/PONG every 30 seconds" },
            { icon: Network, title: "Connection Pool", desc: "1000+ concurrent connections" },
            { icon: Zap, title: "Fast Protocol", desc: "Binary JSON with 4-byte length prefix" },
            { icon: Shield, title: "TypeScript", desc: "Full type definitions included" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  {feature.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
          Perfect For
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Microservices",
              icon: Server,
              desc: "Share one AxioDB instance across multiple services",
              color: "blue"
            },
            {
              title: "Desktop Apps",
              icon: Package,
              desc: "Electron apps connecting to local or remote database",
              color: "green"
            },
            {
              title: "Cloud Deployments",
              icon: Cloud,
              desc: "Deploy to AWS, Azure, Google Cloud, DigitalOcean",
              color: "purple"
            },
          ].map((useCase, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br from-${useCase.color}-50 to-${useCase.color}-100 dark:from-${useCase.color}-900/20 dark:to-${useCase.color}-800/20 p-6 rounded-xl border border-${useCase.color}-200 dark:border-${useCase.color}-700`}
            >
              <useCase.icon className={`h-12 w-12 text-${useCase.color}-600 dark:text-${useCase.color}-400 mb-4`} />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {useCase.title}
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                {useCase.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-xl">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-6 text-blue-100">
          Deploy AxioDB in minutes and start connecting from anywhere.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/installation"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Installation Guide
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="/api-reference"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            API Reference
            <Code2 className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default AxioDBCloud;
