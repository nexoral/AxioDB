import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDbStore } from "../store/dbStore";
import apiClient from "../api/client";
import ObjectView from "../components/query/ObjectView";
import QueryEditor from "../components/query/QueryEditor";
import { parseExpression, parseLiteral, validate } from "../components/query/queryLanguage";
import InsertDocumentModal from "../components/document/InsertDocumentModal";
import UpdateDocumentModal from "../components/document/UpdateDocumentModal";
import DeleteDocumentModal from "../components/document/DeleteDocumentModal";
import CreateCollectionModal from "../components/collection/CreateCollectionModal";
import DeleteCollectionModal from "../components/collection/DeleteCollectionModal";
import DocumentCard from "../components/document/DocumentCard";

const Documents = () => {
  const {
    databases,
    collectionsMap,
    selectedDatabase,
    selectedCollection,
    activeTab,
    setSelectedDatabase,
    setSelectedCollection,
    setActiveTab,
    fetchCollections,
    fetchDatabases,
    addCollectionLocally,
    removeCollectionLocally,
  } = useDbStore();

  // Documents & Query state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalDocs, setTotalDocs] = useState(0);
  const [queryLatency, setQueryLatency] = useState(null);

  // Compass-style Filter Bar inputs (accepts relaxed JS object literals)
  const [filterStr, setFilterStr] = useState("");
  const [sortStr, setSortStr] = useState("");
  const [projectStr, setProjectStr] = useState("");
  const [skipStr, setSkipStr] = useState("0");

  // Query Console state
  const [consoleQuery, setConsoleQuery] = useState("");
  const [consoleResults, setConsoleResults] = useState(null);
  const [consoleRunning, setConsoleRunning] = useState(false);
  const [consoleError, setConsoleError] = useState(null);

  // Modals state
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [inspectorDoc, setInspectorDoc] = useState(null); // Side Drawer
  const [showCreateColl, setShowCreateColl] = useState(false);
  const [collToDelete, setCollToDelete] = useState(null);

  // Sync console query when selected collection changes
  useEffect(() => {
    if (selectedCollection) {
      setConsoleQuery(`${selectedCollection}.query({}).exec()`);
      setConsoleResults(null);
      setConsoleError(null);
    }
  }, [selectedCollection]);

  // Extract known field keys from loaded documents to power autocomplete suggestions
  const collectionFields = useMemo(() => {
    const keySet = new Set([
      "name", "title", "email", "phone", "city", "state", "country", "address",
      "status", "role", "type", "description", "age", "price"
    ]);
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        if (doc && typeof doc === "object") {
          Object.keys(doc).forEach((k) => {
            if (k !== "_id" && k !== "documentId" && k !== "updatedAt") {
              keySet.add(k);
            }
          });
        }
      }
    }
    return Array.from(keySet);
  }, [documents]);

  // Query Console diagnostics
  const consoleDiagnostics = useMemo(() => {
    if (!consoleQuery.trim() || !selectedCollection) return [];
    return validate(consoleQuery, selectedCollection);
  }, [consoleQuery, selectedCollection]);

  // Quick query examples for the Query Console
  const queryExamples = useMemo(() => {
    const col = selectedCollection || "collection";
    return [
      { label: "All documents", code: `${col}.query({}).exec()` },
      { label: "Exact match", code: `${col}.query({ status: 'active' }).exec()` },
      { label: "Comparison", code: `${col}.query({ age: { $gte: 18 } }).exec()` },
      { label: "Any of", code: `${col}.query({ status: { $in: ['active', 'pending'] } }).exec()` },
      { label: "Pattern", code: `${col}.query({ name: { $regex: '^a', $options: 'i' } }).exec()` },
      { label: "Aggregate", code: `${col}.aggregate([{ $match: {} }, { $group: { _id: '$status', total: { $sum: 1 } } }]).exec()` },
    ];
  }, [selectedCollection]);

  // Load documents when collection or page changes
  const loadDocuments = useCallback(async () => {
    if (!selectedDatabase || !selectedCollection) return;
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      let url = `/api/operation/all/?dbName=${encodeURIComponent(selectedDatabase)}&collectionName=${encodeURIComponent(selectedCollection)}&page=${page}&limit=${limit}`;
      const res = await apiClient.get(url);
      const latency = Math.round(performance.now() - start);
      setQueryLatency(latency);

      const payload = res.data?.data?.data || res.data?.data || {};
      const docs = Array.isArray(payload.documents) ? payload.documents : (Array.isArray(payload) ? payload : []);
      setDocuments(docs);
      setTotalDocs(payload.totalDocuments ?? docs.length);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError(err.response?.data?.message || err.message || "Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDatabase, selectedCollection, page, limit]);

  useEffect(() => {
    if (selectedDatabase && selectedCollection) {
      loadDocuments();
    }
  }, [selectedDatabase, selectedCollection, page, limit, loadDocuments]);

  // Apply Compass-style filter: parses relaxed JavaScript object syntax (no JSON required)
  const handleApplyFilter = async () => {
    if (!selectedDatabase || !selectedCollection) return;
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      let parsedFilter = {};
      if (filterStr.trim()) {
        let clean = filterStr.trim();
        if (!clean.startsWith("{") && !clean.startsWith("[")) {
          clean = `{ ${clean} }`;
        }
        try {
          parsedFilter = parseLiteral(clean);
        } catch {
          try {
            parsedFilter = JSON.parse(clean);
          } catch {
            // eslint-disable-next-line no-new-func
            parsedFilter = new Function(`return (${clean})`)();
          }
        }
      }

      const res = await apiClient.post(
        `/api/operation/all/by-query/?dbName=${encodeURIComponent(selectedDatabase)}&collectionName=${encodeURIComponent(selectedCollection)}&page=${page}&limit=${limit}`,
        { query: parsedFilter }
      );

      const latency = Math.round(performance.now() - start);
      setQueryLatency(latency);

      const payload = res.data?.data?.data || res.data?.data || {};
      const docs = Array.isArray(payload.documents) ? payload.documents : (Array.isArray(payload) ? payload : []);
      setDocuments(docs);
      setTotalDocs(payload.totalDocuments ?? docs.length);
    } catch (err) {
      console.error("Filter error:", err);
      setError(err.response?.data?.message || "Invalid query filter syntax. You can use JavaScript object syntax.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilter = () => {
    setFilterStr("");
    setSortStr("");
    setProjectStr("");
    setSkipStr("0");
    setPage(1);
    loadDocuments();
  };

  // Run Query in Console tab (supports expressions like <col>.query({...}).exec() AND raw objects)
  const handleRunConsoleQuery = async () => {
    if (!consoleQuery.trim() || !selectedDatabase || !selectedCollection) return;
    setConsoleRunning(true);
    setConsoleError(null);
    const start = performance.now();

    try {
      const trimmed = consoleQuery.trim();
      const parsed = parseExpression(trimmed);

      if (parsed) {
        const payload = parseLiteral(parsed.args || "{}");
        if (parsed.method === "aggregate") {
          const res = await apiClient.post(
            `/api/operation/aggregate/?dbName=${encodeURIComponent(selectedDatabase)}&collectionName=${encodeURIComponent(selectedCollection)}`,
            { aggregation: payload }
          );
          const docs = res.data?.data?.documents || res.data?.data || [];
          const latency = Math.round(performance.now() - start);
          setConsoleResults({
            executionTime: `${latency}ms`,
            count: docs.length,
            data: docs,
          });
          return;
        } else {
          // Method is query
          const res = await apiClient.post(
            `/api/operation/all/by-query/?dbName=${encodeURIComponent(selectedDatabase)}&collectionName=${encodeURIComponent(selectedCollection)}&page=1&limit=50`,
            { query: payload }
          );
          const payloadData = res.data?.data?.data || res.data?.data || {};
          const docs = Array.isArray(payloadData.documents) ? payloadData.documents : (Array.isArray(payloadData) ? payloadData : []);
          const latency = Math.round(performance.now() - start);
          setConsoleResults({
            executionTime: `${latency}ms`,
            count: docs.length,
            data: docs,
          });
          return;
        }
      }

      // If not a method expression, treat as direct object literal: { status: 'active' }
      let cleanObj = trimmed;
      if (!cleanObj.startsWith("{") && !cleanObj.startsWith("[")) {
        cleanObj = `{ ${cleanObj} }`;
      }
      const rawFilter = parseLiteral(cleanObj);
      const res = await apiClient.post(
        `/api/operation/all/by-query/?dbName=${encodeURIComponent(selectedDatabase)}&collectionName=${encodeURIComponent(selectedCollection)}&page=1&limit=50`,
        { query: rawFilter }
      );
      const payloadData = res.data?.data?.data || res.data?.data || {};
      const docs = Array.isArray(payloadData.documents) ? payloadData.documents : (Array.isArray(payloadData) ? payloadData : []);
      const latency = Math.round(performance.now() - start);
      setConsoleResults({
        executionTime: `${latency}ms`,
        count: docs.length,
        data: docs,
      });
    } catch (err) {
      console.error("Query console error:", err);
      setConsoleError(err.response?.data?.message || err.message || "Failed to execute query");
      setConsoleResults(null);
    } finally {
      setConsoleRunning(false);
    }
  };

  const copyToClipboard = (val) => {
    const text = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);
    navigator.clipboard.writeText(text);
  };

  // ==========================================
  // VIEW 1: No Database Selected Placeholder
  // ==========================================
  if (!selectedDatabase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200 shadow-xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <ellipse cx="12" cy="6" rx="8" ry="3" strokeWidth={1.8} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Select a Database to Explore</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Choose an existing database from the left explorer tree or create a new database to start managing collections and documents.
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: Database Overview (No collection selected)
  // ==========================================
  if (!selectedCollection) {
    const colls = collectionsMap[selectedDatabase] || [];

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Database Header */}
        <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <ellipse cx="12" cy="6" rx="8" ry="3" strokeWidth={1.8} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">{selectedDatabase}</h1>
              <p className="text-xs text-slate-500 font-mono">
                {colls.length} {colls.length === 1 ? "Collection" : "Collections"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateColl(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Collection
            </button>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Collections in {selectedDatabase}
              </h2>
            </div>

            {colls.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Collections Yet</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Create your first collection in this database to begin storing documents.
                </p>
                <button
                  onClick={() => setShowCreateColl(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  Create Collection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colls.map((c) => {
                  const name = c.name || c;
                  const count = c.count !== undefined ? c.count : (c.documentCount || 0);

                  return (
                    <div
                      key={name}
                      onClick={() => setSelectedCollection(selectedDatabase, name)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-4 shadow-xs transition-all cursor-pointer group hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {count} docs
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        Click to open documents and query console
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <CreateCollectionModal
          isOpen={showCreateColl}
          databaseName={selectedDatabase}
          onClose={() => setShowCreateColl(false)}
          onCollectionCreated={(newCollName) => {
            setShowCreateColl(false);
            addCollectionLocally(selectedDatabase, newCollName);
            setSelectedCollection(selectedDatabase, newCollName);
          }}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 3: Collection Workspace
  // ==========================================
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans select-none">
      {/* Top Collection Breadcrumb Bar */}
      <div className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span
            onClick={() => setSelectedCollection(selectedDatabase, "")}
            className="text-slate-500 hover:text-emerald-700 cursor-pointer font-bold"
          >
            {selectedDatabase}
          </span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
            {selectedCollection}
          </span>
          <span className="text-slate-400 text-[11px] ml-1">
            ({totalDocs} {totalDocs === 1 ? "document" : "documents"})
          </span>
        </div>

        {/* Tab Switcher & Action Buttons (Documents & Query Console only) */}
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === "documents"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab("query")}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === "query"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Query Console
            </button>
          </div>

          {activeTab === "documents" && (
            <button
              onClick={() => setShowInsertModal(true)}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Insert Document
            </button>
          )}

          <button
            onClick={() => setCollToDelete(selectedCollection)}
            title="Drop Collection"
            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: DOCUMENTS (Compass-style Filter & Table)
         ========================================== */}
      {activeTab === "documents" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Compass-Style Query & Filter Bar (JavaScript Object Literal Syntax) */}
          <div className="p-3 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              {/* Filter */}
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 font-mono">
                  Filter
                </span>
                <input
                  type="text"
                  value={filterStr}
                  onChange={(e) => setFilterStr(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                  placeholder="{ status: 'active' }"
                  className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Sort */}
              <div className="w-48 flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 font-mono">
                  Sort
                </span>
                <input
                  type="text"
                  value={sortStr}
                  onChange={(e) => setSortStr(e.target.value)}
                  placeholder="{ _id: -1 }"
                  className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <button
                onClick={handleApplyFilter}
                className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Find
              </button>

              <button
                onClick={handleResetFilter}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Reset
              </button>

              {/* Cards Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="text-emerald-700 font-semibold">
                  {documents.length} document{documents.length !== 1 ? "s" : ""}
                </span>
                {queryLatency !== null && (
                  <span>⚡ {queryLatency}ms</span>
                )}
              </div>
            </div>

            {/* Sub-bar: Query Timing & Active Filter */}
            {queryLatency !== null && (
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
                <span className="text-emerald-700 font-semibold">⚡ {queryLatency}ms</span>
                <span>•</span>
                <span>{documents.length} documents retrieved</span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Content Area: Table / JSON List with Drawer */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-auto bg-white">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600 mb-1">No matching documents</p>
                  <p>Try clearing your filter or inserting a new document.</p>
                </div>
              ) : (
                /* Card-based Document View */
                <div className="p-4">
                  <AnimatePresence>
                    {documents.map((doc, idx) => (
                      <DocumentCard
                        key={doc._id || idx}
                        doc={doc}
                        idx={idx}
                        isSelected={inspectorDoc?._id === doc._id}
                        onInspect={(d) => setInspectorDoc(d)}
                        onEdit={(d) => {
                          setSelectedDoc(d);
                          setShowUpdateModal(true);
                        }}
                        onDelete={(d) => {
                          setSelectedDoc(d);
                          setShowDeleteModal(true);
                        }}
                        copyToClipboard={copyToClipboard}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Side Document Inspector Drawer */}
            {inspectorDoc && (
              <div className="w-96 border-l border-slate-200 bg-white flex flex-col justify-between shrink-0 shadow-lg animate-slideIn">
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-800">Document Inspector</h3>
                    <p className="text-[10px] font-mono text-slate-400 truncate">ID: {inspectorDoc._id || inspectorDoc.documentId}</p>
                  </div>
                  <button
                    onClick={() => setInspectorDoc(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-3 bg-slate-50">
                  <ObjectView value={(() => {
                    if (!inspectorDoc || typeof inspectorDoc !== "object") return inspectorDoc;
                    const { _id, documentId, updatedAt, ...rest } = inspectorDoc;
                    return rest;
                  })()} maxHeight={600} />
                </div>

                <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
                  <button
                    onClick={() => copyToClipboard(inspectorDoc)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoc(inspectorDoc);
                      setShowUpdateModal(true);
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Edit Document
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Pagination Bar */}
          <div className="h-9 border-t border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 text-xs text-slate-600 font-mono">
            <div>
              Showing {documents.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalDocs)} of {totalDocs}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 font-sans cursor-pointer"
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={page * limit >= totalDocs}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-0.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 font-sans cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: QUERY CONSOLE
         ========================================== */}
      {activeTab === "query" && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-50">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Interactive Query Console</h2>
              <p className="text-xs text-slate-500">
                Run JavaScript queries or aggregations against <span className="font-mono font-semibold text-emerald-700">{selectedCollection}</span>.
              </p>
            </div>
            <button
              onClick={handleRunConsoleQuery}
              disabled={consoleRunning}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              {consoleRunning ? "Running..." : "Run Query (Ctrl+Enter)"}
            </button>
          </div>

          {/* Quick Example Query Pills */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Examples:</span>
            {queryExamples.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setConsoleQuery(ex.code)}
                title={ex.code}
                className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* QueryEditor with full autocomplete & diagnostics */}
          <div className="mb-2">
            <QueryEditor
              value={consoleQuery}
              onChange={setConsoleQuery}
              collectionName={selectedCollection}
              fields={collectionFields}
              diagnostics={consoleDiagnostics}
              onSubmit={handleRunConsoleQuery}
              minHeight={150}
              maxHeight={220}
            />
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-sans">
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[11px]">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[11px]">Space</kbd>
            <span>suggestions</span>
            <span className="mx-1">•</span>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[11px]">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[11px]">Enter</kbd>
            <span>run query</span>
          </div>

          {/* Query Results */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 font-medium">
              <span>Query Results</span>
              {consoleResults && (
                <span className="font-mono text-emerald-700 font-semibold">
                  ⚡ {consoleResults.executionTime} • {consoleResults.count} matches
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto p-3 bg-slate-50">
              {consoleError ? (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-mono">{consoleError}</div>
              ) : consoleResults ? (
                <ObjectView value={consoleResults.data} maxHeight={500} />
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-mono">
                  Write a query above and press "Run Query" (Ctrl+Enter)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals with autocomplete field suggestions */}
      <InsertDocumentModal
        isOpen={showInsertModal}
        databaseName={selectedDatabase}
        collectionName={selectedCollection}
        fields={collectionFields}
        onClose={() => setShowInsertModal(false)}
        onDocumentInserted={() => {
          setShowInsertModal(false);
          loadDocuments();
        }}
      />

      <UpdateDocumentModal
        isOpen={showUpdateModal}
        databaseName={selectedDatabase}
        collectionName={selectedCollection}
        document={selectedDoc}
        fields={collectionFields}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedDoc(null);
        }}
        onDocumentUpdated={() => {
          setShowUpdateModal(false);
          setSelectedDoc(null);
          loadDocuments();
        }}
      />

      <DeleteDocumentModal
        isOpen={showDeleteModal}
        databaseName={selectedDatabase}
        collectionName={selectedCollection}
        documentId={selectedDoc?._id || selectedDoc?.documentId}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        onDocumentDeleted={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
          loadDocuments();
        }}
      />

      <DeleteCollectionModal
        isOpen={!!collToDelete}
        databaseName={selectedDatabase}
        collectionName={collToDelete}
        onClose={() => setCollToDelete(null)}
        onCollectionDeleted={(deletedName) => {
          setCollToDelete(null);
          removeCollectionLocally(selectedDatabase, deletedName);
          setSelectedCollection(selectedDatabase, "");
        }}
      />
    </div>
  );
};

export default Documents;
