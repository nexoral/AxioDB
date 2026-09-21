import React from "react";
import { useConnectionStore } from "../store/connectionStore";
import { useAuthStore } from "../store/authStore";
import { useDbStore } from "../store/dbStore";

const StatusBar = () => {
  const { protocol, host, port, pingLatency, isConnected } = useConnectionStore();
  const { role } = useAuthStore();
  const { selectedDatabase, selectedCollection } = useDbStore();

  return (
    <footer className="h-6 w-full bg-slate-100 border-t border-slate-200 flex items-center justify-between px-3 text-[11px] text-slate-600 select-none shrink-0 font-mono">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-emerald-500 shadow-xs" : "bg-slate-400"
            }`}
          />
          <span className="font-medium text-slate-700">{isConnected ? `${protocol}://${host}:${port}` : "Offline"}</span>
        </div>

        {isConnected && pingLatency !== null && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold">{pingLatency} ms</span>
          </>
        )}

        {selectedDatabase && (
          <>
            <span className="text-slate-300">|</span>
            <span>
              db: <span className="text-slate-900 font-semibold">{selectedDatabase}</span>
              {selectedCollection && (
                <> / coll: <span className="text-emerald-700 font-semibold">{selectedCollection}</span></>
              )}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {role && (
          <>
            <span>role: <span className="text-slate-800 font-semibold capitalize">{role}</span></span>
            <span className="text-slate-300">|</span>
          </>
        )}
        <span className="text-slate-400 font-sans">AxioDB Control v22.3.1</span>
      </div>
    </footer>
  );
};

export default StatusBar;
