import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ObjectView from "../query/ObjectView";

const FIELD_LIMIT = 10;

const formatFieldValue = (val) => {
  if (val === null) return "null";
  if (val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

const getDisplayFields = (doc) => {
  if (!doc || typeof doc !== "object") return [];
  return Object.entries(doc).filter(
    ([k]) => k !== "_id" && k !== "documentId" && k !== "updatedAt",
  );
};

const DocumentCard = ({ doc, idx, isSelected, onInspect, onEdit, onDelete, copyToClipboard }) => {
  const [expanded, setExpanded] = useState(false);
  const displayFields = getDisplayFields(doc);
  const shownFields = expanded ? displayFields : displayFields.slice(0, FIELD_LIMIT);
  const hasMore = displayFields.length > FIELD_LIMIT;
  const docId = doc._id || doc.documentId || `doc-${idx}`;

  const fieldColor = (key, val) => {
    if (typeof val === "number") return "text-amber-700";
    if (typeof val === "boolean") return "text-cyan-700";
    if (typeof val === "object" && val !== null) return "text-purple-600";
    return "text-slate-800";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: idx * 0.03 }}
      onClick={() => onInspect(doc)}
      className={`
        relative group mb-3 rounded-xl border bg-white p-3 shadow-xs
        transition-all cursor-pointer
        ${isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md"
          : "border-slate-200 hover:border-emerald-400 hover:shadow-sm"}
      `}
    >
      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1 text-[10px] font-mono text-slate-400">
        <span className="font-bold text-emerald-800 truncate" title={docId}>
          #{docId}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(doc);
            }}
            className="p-0.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
            title="Copy JSON"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 16v-6a4 4 0 014-4h.5m0 0A2.5 2.5 0 1112 9.5M8 16l6-6m-3.5 0h7a2 2 0 012 2v4a2 2 0 01-2 2h-7a2 2 0 01-2-2v-4a2 2 0 012-2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(doc);
            }}
            className="p-0.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(doc);
            }}
            className="p-0.5 rounded text-slate-500 hover:text-red-600 hover:bg-slate-100"
            title="Delete"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 4 0 00-1-1h-4a1 4 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {shownFields.map(([key, val], i) => {
          const isObj = typeof val === "object" && val !== null;
          const displayVal = isObj ? JSON.stringify(val) : formatFieldValue(val);
          return (
            <motion.div
              key={`${docId}-${key}-${i}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15, delay: i * 0.02 }}
              className="mb-1.5 grid grid-cols-[120px_1fr] gap-2 text-[11px] font-mono"
            >
              <span className="text-slate-500 font-semibold truncate pr-1" title={key}>
                {key}
              </span>
              <span
                className={`truncate ${isObj ? fieldColor(key, val) : fieldColor(key, val)}`}
                title={displayVal}
              >
                {isObj ? displayVal : displayVal}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {expanded && displayFields.length > shownFields.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2"
        >
          <ObjectView value={doc} maxHeight={300} />
        </motion.div>
      )}

      {hasMore && (
        <motion.button
          layout
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-1.5 w-full text-center text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md py-1 transition-colors"
        >
          <AnimatePresence mode="wait">
            {expanded ? (
              <motion.span
                key="less"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
              >
                Show less −
              </motion.span>
            ) : (
              <motion.span
                key="more"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                Show more +{displayFields.length - FIELD_LIMIT} field{displayFields.length - FIELD_LIMIT !== 1 ? "s" : ""}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </motion.div>
  );
};

export default DocumentCard;
