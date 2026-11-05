import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";

const QueryHistoryModal = ({ isOpen, onClose, onSelectQuery, currentCollection, currentDatabase }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!window.electronAPI?.store?.getQueryHistory) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await window.electronAPI.store.getQueryHistory(50);
      setHistory(items || []);
    } catch (err) {
      console.error("Failed to load query history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleClear = async () => {
    if (window.electronAPI?.store?.clearQueryHistory) {
      await window.electronAPI.store.clearQueryHistory();
      setHistory([]);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Query Execution History"
      subtitle="Recent queries executed in AxioDB"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleClear}
            disabled={history.length === 0}
            className="text-xs text-red-600 hover:text-red-700 disabled:opacity-40 font-medium transition-colors cursor-pointer"
          >
            Clear History
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="max-h-96 overflow-y-auto space-y-2 py-1 pr-1 font-sans">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No query history recorded yet.</div>
        ) : (
          history.map((item) => {
            const isMatch = item.collection === currentCollection;
            return (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200/90 hover:border-emerald-400 bg-white hover:bg-slate-50/70 transition-all flex flex-col gap-1.5 group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        item.status === "error"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.status || "success"}
                    </span>
                    {item.collection && (
                      <span className="text-slate-600 font-semibold">{item.collection}</span>
                    )}
                    {item.durationMs !== undefined && (
                      <span className="text-slate-400">{item.durationMs}ms</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatTime(item.timestamp)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectQuery(item.query);
                        onClose();
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      Use
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto whitespace-pre-wrap break-all">
                  {item.query}
                </pre>
                {item.error && (
                  <p className="text-[11px] text-red-600 font-mono">{item.error}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default QueryHistoryModal;
