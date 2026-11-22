import React, { useState } from "react";
import { motion } from "framer-motion";
import { vectorSearch } from "../../api/client";
import ObjectView from "./ObjectView";

const VectorSearchTab = ({ selectedDatabase, selectedCollection }) => {
  const [field, setField] = useState("embedding");
  const [metric, setMetric] = useState("cosine");
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState("");
  const [vectorInput, setVectorInput] = useState("[0.12, 0.85, -0.44, 0.31, 0.05]");
  const [preFilterInput, setPreFilterInput] = useState("");
  const [showPreFilter, setShowPreFilter] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  const handleRunSearch = async () => {
    if (!selectedDatabase || !selectedCollection) {
      setError("Please select a database and collection first.");
      return;
    }

    let parsedVector;
    try {
      parsedVector = JSON.parse(vectorInput);
      if (!Array.isArray(parsedVector) || parsedVector.length === 0) {
        throw new Error("Vector must be a non-empty array of numbers");
      }
      for (let i = 0; i < parsedVector.length; i++) {
        if (typeof parsedVector[i] !== "number" || !Number.isFinite(parsedVector[i])) {
          throw new Error(`Element at index ${i} is not a valid finite number`);
        }
      }
    } catch (err) {
      setError(`Vector parsing error: ${err.message}`);
      return;
    }

    let parsedQuery;
    if (showPreFilter && preFilterInput.trim()) {
      try {
        parsedQuery = JSON.parse(preFilterInput);
      } catch (err) {
        setError(`Pre-filter JSON parsing error: ${err.message}`);
        return;
      }
    }

    setError(null);
    setLoading(true);
    const start = performance.now();

    try {
      const options = {
        topK: Number(topK) || 5,
        metric,
      };
      if (minScore !== "" && !isNaN(Number(minScore))) {
        options.minScore = Number(minScore);
      }

      const res = await vectorSearch(selectedDatabase, selectedCollection, {
        field: field.trim() || "embedding",
        vector: parsedVector,
        options,
        query: parsedQuery,
      });

      const end = performance.now();
      setLatencyMs(Math.round(end - start));

      const docs = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setResults(docs);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Vector search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score) => {
    if (typeof score !== "number") return null;

    if (metric === "euclidean") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          dist: {score.toFixed(4)}
        </span>
      );
    }

    const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
    let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score < 0.70) {
      colorClass = "bg-slate-100 text-slate-700 border-slate-200";
    } else if (score < 0.85) {
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    }

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
        {pct}% match ({score.toFixed(4)})
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Top Configuration Bar */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Vector Field
            </label>
            <input
              type="text"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="embedding"
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white w-36 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Metric
            </label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {["cosine", "dot", "euclidean"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                    metric === m
                      ? "bg-white text-emerald-700 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Top-K
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white w-20 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Min Score
            </label>
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 0.70"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white w-24 font-mono"
            />
          </div>

          <div className="flex items-end ml-auto gap-2">
            <button
              onClick={() => setShowPreFilter(!showPreFilter)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showPreFilter
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {showPreFilter ? "Hide Filter" : "+ Pre-filter"}
            </button>

            <button
              onClick={handleRunSearch}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                  Run Vector Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vector Array Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Query Vector JSON Array
          </label>
          <textarea
            rows={2}
            value={vectorInput}
            onChange={(e) => setVectorInput(e.target.value)}
            placeholder="[0.12, 0.45, -0.67, ...]"
            className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white resize-y"
          />
        </div>

        {/* Collapsible Pre-filter Query */}
        {showPreFilter && (
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Metadata Pre-Filter Query (JSON)
            </label>
            <input
              type="text"
              value={preFilterInput}
              onChange={(e) => setPreFilterInput(e.target.value)}
              placeholder='{"category": "ai", "status": "active"}'
              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Results View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {results !== null && (
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
            <span>
              Found <strong className="text-slate-800">{results.length}</strong> ranked matches
            </span>
            {latencyMs !== null && (
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {latencyMs} ms
              </span>
            )}
          </div>
        )}

        {results && results.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No matching documents found</p>
            <p className="text-xs text-slate-400 mt-1">Try lowering the minScore or verifying your vector field name.</p>
          </div>
        )}

        {results && results.map((doc, idx) => (
          <motion.div
            key={doc.documentId || idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.03 }}
            className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-2 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  #{idx + 1}
                </span>
                <span className="text-xs font-mono text-slate-500 truncate max-w-xs">
                  {doc.documentId}
                </span>
              </div>
              {getScoreBadge(doc._score)}
            </div>

            <div className="text-xs bg-slate-50 p-2 rounded-md border border-slate-100 overflow-x-auto">
              <ObjectView value={doc} maxHeight={250} />
            </div>
          </motion.div>
        ))}

        {results === null && !loading && (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-600">Semantic Vector Search Playground</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Enter a query vector array above and hit Run Vector Search to compute similarity across documents. Works seamlessly over HTTP and TCP.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorSearchTab;
