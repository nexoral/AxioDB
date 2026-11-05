import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";

const AuditLogModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    if (!window.electronAPI?.store?.getAuditLogs) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await window.electronAPI.store.getAuditLogs(60);
      setLogs(items || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const handleClear = async () => {
    if (window.electronAPI?.store?.clearAuditLogs) {
      await window.electronAPI.store.clearAuditLogs();
      setLogs([]);
    }
  };

  const getActionBadge = (action) => {
    const act = (action || "").toLowerCase();
    if (act.includes("delete") || act.includes("drop") || act.includes("remove")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (act.includes("insert") || act.includes("create")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (act.includes("update") || act.includes("modify")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit & Activity Trail"
      subtitle="Local activity log of database, collection, and document operations"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleClear}
            disabled={logs.length === 0}
            className="text-xs text-red-600 hover:text-red-700 disabled:opacity-40 font-medium transition-colors cursor-pointer"
          >
            Clear Activity Log
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
          <div className="text-center py-8 text-xs text-slate-400">Loading activity trail...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No audit records yet. Operations like insert, update, delete, and collection drops will appear here.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getActionBadge(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  {log.database && (
                    <span className="font-semibold text-slate-800">
                      db: <span className="font-mono text-emerald-700">{log.database}</span>
                    </span>
                  )}
                  {log.collection && (
                    <span className="font-semibold text-slate-800">
                      coll: <span className="font-mono text-slate-700">{log.collection}</span>
                    </span>
                  )}
                </div>
                {log.details && (
                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded border border-slate-100 overflow-x-auto whitespace-pre-wrap break-all">
                    {log.details}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap mt-0.5">
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default AuditLogModal;
