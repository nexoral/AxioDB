import React from "react";
import { AlertCircle, Brain, CheckCircle, Compass, Cpu, Layers, Sparkles, Zap } from "lucide-react";
import CodeBlock from "../ui/CodeBlock";
import Seo from "../ui/Seo";

const VectorSearch: React.FC = () => {
  const codeExamples = {
    insert: `const { AxioDB } = require("axiodb");

const db = new AxioDB();
const myDB = await db.createDB("AgentDB");
const memories = await myDB.createCollection("memories");

// 1. Insert documents with vector embeddings (no schema needed)
await memories.insertMany([
  {
    title: "TypeScript Guide",
    category: "tech",
    embedding: [0.12, 0.85, -0.34, 0.42] // e.g., generated via OpenAI, Ollama, etc.
  },
  {
    title: "Coffee Brewing Basics",
    category: "lifestyle",
    embedding: [-0.65, 0.12, 0.78, -0.05]
  },
  {
    title: "Node.js Concurrency",
    category: "tech",
    embedding: [0.15, 0.82, -0.30, 0.45]
  }
]);`,

    pureSearch: `// 2. Pure Vector Search (Direct Collection Method)
const queryVector = [0.14, 0.84, -0.32, 0.44];

const results = await memories.vectorSearch("embedding", queryVector, {
  topK: 2,         // Return the top 2 closest documents
  minScore: 0.80,  // Only return results with >= 80% similarity
  metric: "cosine" // Options: "cosine" (default), "dot", "euclidean"
});

console.log(results.data.documents);
/*
Output:
[
  {
    title: "TypeScript Guide",
    category: "tech",
    _score: 0.9998
  },
  {
    title: "Node.js Concurrency",
    category: "tech",
    _score: 0.9984
  }
]
*/`,

    hybridSearch: `// 3. Hybrid Search: Filter by metadata + Rank by vector similarity
const queryVector = [0.14, 0.84, -0.32, 0.44];

const results = await memories
  .query({
    category: "tech",            // Regular filter
    views: { $gte: 100 }         // Any standard AxioDB query operator
  })
  .vectorSearch("embedding", queryVector, {
    topK: 5,
    metric: "cosine"
  })
  .exec();

console.log(results.data.documents);`,

    paginationProjection: `// 4. Pagination & Projection with Vector Search
const results = await memories
  .query({ category: "tech" })
  .vectorSearch("embedding", queryVector)
  .Skip(5)                                // Skip first 5 matches
  .Limit(5)                               // Return next 5 matches
  .setProject({ title: 1, _score: 1 })    // Keep only title and similarity score
  .exec();`,

    agentMemory: `// 5. Example: Instant Episodic Memory for an AI Agent
class AgentMemory {
  constructor(collection) {
    this.collection = collection;
  }

  // Store a conversation turn instantly
  async record(userId, userMessage, embedding) {
    await this.collection.insert({
      userId,
      message: userMessage,
      embedding,
      timestamp: Date.now()
    });
  }

  // Recall the most relevant past thoughts or interactions
  async recall(userId, currentTopicVector) {
    const memory = await this.collection
      .query({ userId })
      .vectorSearch("embedding", currentTopicVector, {
        topK: 3,
        minScore: 0.75
      })
      .exec();

    return memory.data.documents;
  }
}`
  };

  return (
    <>
      <section className="pt-12 scroll-mt-20">
        <Seo
          title="Vector & Semantic Search in AxioDB - Pure & Hybrid Search"
          description="Perform fast semantic similarity and vector search in AxioDB. Combine MongoDB-style filters with Cosine, Dot Product, and Euclidean distance metrics."
          path="/vector-search"
          ogType="article"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent-100/50 text-accent-700 border border-accent-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI & Semantic Search
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Vector Search
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Find documents by <strong>meaning and similarity</strong> rather than exact keyword matches. AxioDB provides native, zero-dependency vector similarity search with full support for pure vector queries and hybrid filtered searches.
          </p>
        </div>

        {/* What is this? */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3 text-accent-600 font-semibold">
              <Brain className="w-5 h-5" />
              <span>What is Vector Search?</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Traditional database queries look for exact matches (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">status == "active"</code>). Vector search converts text, images, or audio into arrays of numbers (embeddings) and finds records with the closest semantic meaning — even if they share zero words in common.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3 text-emerald-600 font-semibold">
              <Compass className="w-5 h-5" />
              <span>Pure vs. Hybrid Search</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              <strong>Pure Vector Search:</strong> Finds the overall most similar documents across your entire collection.<br />
              <strong>Hybrid Search:</strong> First filters documents using traditional criteria (user ID, dates, category), then ranks the remaining candidates by semantic similarity.
            </p>
          </div>
        </div>

        {/* Where Can It Be Used? */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          Where Can It Be Used?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">🧠 Agent Episodic Memory</h3>
            <p className="text-xs text-gray-600">Give AI agents private, long-term memory that recalls relevant past dialogues and actions instantly.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">🔍 Local RAG & Docs</h3>
            <p className="text-xs text-gray-600">Retrieve relevant knowledge base articles or code snippets based on user questions without external SaaS APIs.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">🎯 Content Recommendation</h3>
            <p className="text-xs text-gray-600">Recommend "more like this" articles, products, or user profiles using behavioral embedding vectors.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">🛡️ Duplicate Detection</h3>
            <p className="text-xs text-gray-600">Detect semantically identical support tickets, duplicate questions, or spam variants automatically.</p>
          </div>
        </div>

        {/* Why AxioDB's Approach? */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Why AxioDB Vector Search?
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              • <strong>100% Exact Recall:</strong> AxioDB uses Exact k-Nearest Neighbors (k-NN). Unlike approximate graph algorithms that can miss the true closest match, AxioDB guarantees mathematical ground truth.
            </p>
            <p>
              • <strong>Instant Writes (&lt; 1 ms):</strong> Documents with embeddings are written instantly with ACID locks. There is zero graph-building delay or background re-indexing queue.
            </p>
            <p>
              • <strong>Zero Native Dependencies:</strong> Runs natively anywhere Node.js or Bun runs (Linux, macOS, Windows, Docker, Electron). No C++ compilers, Python sidecars, or external vector databases required.
            </p>
            <p>
              • <strong>Automatic Score Attribution:</strong> Every matching document includes an exact <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-accent-700">_score</code> attribute so your code can inspect match quality.
            </p>
          </div>
        </div>

        {/* Syntax & Code Examples */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-accent-600" />
          Syntax & Examples
        </h2>

        {/* Step 1: Storing Vectors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Storing Vector Embeddings</h3>
          <p className="text-gray-600 text-sm mb-3">
            Vectors are stored as standard arrays of numbers on any field name of your choice (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded">embedding</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">vec</code>).
          </p>
          <CodeBlock code={codeExamples.insert} language="javascript" />
        </div>

        {/* Step 2: Pure Search */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Pure Vector Search</h3>
          <p className="text-gray-600 text-sm mb-3">
            Use the shorthand <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-accent-700">collection.vectorSearch(field, vector, options)</code> to find the closest matches across all documents.
          </p>
          <CodeBlock code={codeExamples.pureSearch} language="javascript" />
        </div>

        {/* Step 3: Hybrid Search */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Hybrid Search (Filter + Vector)</h3>
          <p className="text-gray-600 text-sm mb-3">
            Chain <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-accent-700">.vectorSearch()</code> into any standard <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-accent-700">.query()</code> pipeline. AxioDB applies the query filters first, then calculates similarity on the matching set.
          </p>
          <CodeBlock code={codeExamples.hybridSearch} language="javascript" />
        </div>

        {/* Step 4: Pagination & Projection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Pagination & Projection</h3>
          <p className="text-gray-600 text-sm mb-3">
            Use <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">Skip()</code> and <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">Limit()</code> to paginate through vector results, and <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">setProject()</code> to select specific fields.
          </p>
          <CodeBlock code={codeExamples.paginationProjection} language="javascript" />
        </div>

        {/* Step 5: Agent Episodic Memory */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">5. AI Agent Episodic Memory Pattern</h3>
          <p className="text-gray-600 text-sm mb-3">
            Store conversations and recall only the relevant past episodes matching the user's current intent:
          </p>
          <CodeBlock code={codeExamples.agentMemory} language="javascript" />
        </div>

        {/* Available Metrics */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          Supported Similarity Metrics
        </h2>
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-left text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold text-gray-900">Metric</th>
                <th className="p-3 font-semibold text-gray-900">Score Range</th>
                <th className="p-3 font-semibold text-gray-900">Best Used For</th>
                <th className="p-3 font-semibold text-gray-900">Sorting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="p-3 font-mono font-medium text-accent-700">cosine</td>
                <td className="p-3 text-gray-600">-1.0 to 1.0 (1.0 is identical)</td>
                <td className="p-3 text-gray-600">Text embeddings & semantic search (OpenAI, HuggingFace, Ollama)</td>
                <td className="p-3 text-gray-600">Highest score first (Descending)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-medium text-accent-700">dot</td>
                <td className="p-3 text-gray-600">Unbounded</td>
                <td className="p-3 text-gray-600">Pre-normalized vectors (fastest computation)</td>
                <td className="p-3 text-gray-600">Highest score first (Descending)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-medium text-accent-700">euclidean</td>
                <td className="p-3 text-gray-600">0.0 to &infin; (0.0 is identical)</td>
                <td className="p-3 text-gray-600">Spatial data, computer vision, geometric distance</td>
                <td className="p-3 text-gray-600">Lowest score first (Ascending)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Limitations & Best Practices */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg mb-12">
          <h2 className="flex items-center text-lg font-semibold text-amber-800 mb-2">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
            Limitations & Best Practices
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-amber-900">
            <li><strong>Dataset Sizing:</strong> AxioDB's exact vector search is optimized for embedded apps, agent memory, and datasets up to tens of thousands of documents per collection.</li>
            <li><strong>Dimension Matching:</strong> All documents evaluated must have the same vector dimension as your query vector. Documents with missing or mismatched dimensions are automatically skipped safely.</li>
            <li><strong>Numeric Types:</strong> Vector elements must be finite numbers (integers or floats). Strings or NaN values inside vector arrays are safely filtered out.</li>
            <li><strong>Embedding Generation:</strong> AxioDB stores and searches vectors; use your favorite embedding model (e.g. <code className="bg-white/80 px-1 py-0.5 rounded">text-embedding-3-small</code>, local Ollama, or Transformers.js) to generate vectors before inserting.</li>
          </ul>
        </div>
      </section>

      {/* Footer Links */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          See also: <a href="/usage" className="text-accent-600 hover:underline">Basic Usage</a> · <a href="/advanced-features" className="text-accent-600 hover:underline">Advanced Features</a> · <a href="/mcp-server" className="text-accent-600 hover:underline">MCP Server</a> · <a href="/api-reference" className="text-accent-600 hover:underline">API Reference</a>
        </p>
      </div>
    </>
  );
};

export default VectorSearch;
