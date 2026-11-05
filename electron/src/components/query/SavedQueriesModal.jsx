import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";

const SavedQueriesModal = ({
  isOpen,
  onClose,
  currentQuery,
  onSelectQuery,
  currentCollection,
  currentDatabase,
}) => {
  const [saved, setSaved] = useState([]);
  const [snippetName, setSnippetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    if (!window.electronAPI?.store?.getSavedQueries) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await window.electronAPI.store.getSavedQueries();
      setSaved(items || []);
    } catch (err) {
      console.error("Failed to load saved queries:", err);
      setSaved([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSaved();
      setSnippetName("");
    }
  }, [isOpen]);

  const handleSaveCurrent = async (e) => {
    e.preventDefault();
    if (!snippetName.trim() || !currentQuery.trim() || !window.electronAPI?.store?.saveQuerySnippet) return;
    setIsSaving(true);
    try {
      await window.electronAPI.store.saveQuerySnippet({
        name: snippetName.trim(),
        query: currentQuery.trim(),
        collection: currentCollection,
        database: currentDatabase,
      });
      setSnippetName("");
      await loadSaved();
    } catch (err) {
      console.error("Failed to save snippet:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.electronAPI?.store?.deleteSavedQuery) return;
    try {
      await window.electronAPI.store.deleteSavedQuery(id);
      setSaved((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete snippet:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saved Query Snippets"
      subtitle="Save and reuse frequent queries across collections"
      size="lg"
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-4 font-sans">
        {/* Quick Save Current Query Form */}
        <form onSubmit={handleSaveCurrent} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Save Current Editor Query</span>
            <span className="text-[10px] text-slate-400 font-mono">
              Target: {currentCollection || "Any"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={snippetName}
              onChange={(e) => setSnippetName(e.target.value)}
              placeholder="Snippet title (e.g. Find Active Customers)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!snippetName.trim() || !currentQuery.trim() || isSaving}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Snippet"}
            </button>
          </div>
        </form>

        {/* Saved Queries List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading saved snippets...</div>
          ) : saved.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No saved query snippets yet. Name and save your first one above!
            </div>
          ) : (
            saved.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-emerald-400 bg-white transition-all flex flex-col gap-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                    {item.collection && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                        {item.collection}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectQuery(item.query);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Load into Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Delete Snippet"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto whitespace-pre-wrap break-all">
                  {item.query}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SavedQueriesModal;
