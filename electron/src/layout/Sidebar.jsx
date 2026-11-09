import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useDbStore } from "../store/dbStore";
import { useConnectionStore } from "../store/connectionStore";
import authApi from "../api/authApi";
import CreateDatabaseModal from "../components/database/CreateDatabaseModal";
import DeleteDatabaseModal from "../components/database/DeleteDatabaseModal";
import CreateCollectionModal from "../components/collection/CreateCollectionModal";
import DeleteCollectionModal from "../components/collection/DeleteCollectionModal";
import AuditLogModal from "../components/audit/AuditLogModal";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { username, role, permissions } = useAuthStore();
  const { protocol, tls, noAuth, disconnect } = useConnectionStore();
  const isTcp = protocol === "tcp";
  const {
    databases,
    collectionsMap,
    pinnedCollections,
    togglePinCollection,
    expandedDbs,
    selectedDatabase,
    selectedCollection,
    loadingTree,
    fetchDatabases,
    fetchCollections,
    toggleDbExpanded,
    setSelectedDatabase,
    setSelectedCollection,
    addDatabaseLocally,
    removeDatabaseLocally,
    addCollectionLocally,
    removeCollectionLocally,
  } = useDbStore();

  const [filterText, setFilterText] = useState("");

  // Modals state
  const [showCreateDb, setShowCreateDb] = useState(false);
  const [dbToDelete, setDbToDelete] = useState(null);
  const [showCreateColl, setShowCreateColl] = useState(false);
  const [createCollDb, setCreateCollDb] = useState("");
  const [collToDelete, setCollToDelete] = useState(null); // { dbName, collName }

  // Export notification
  const [exportMsg, setExportMsg] = useState(null); // { type: 'success'|'error', text: string }
  const [exportingDb, setExportingDb] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const clearExportMsg = () => {
    setTimeout(() => setExportMsg(null), 4000);
  };

  const handleExportDatabase = async (dbName) => {
    setExportingDb(dbName);
    try {
      const result = await authApi.exportDatabase(dbName);
      if (result.canceled) return;
      setExportMsg({ type: "success", text: `${dbName}.tar.gz exported` });
      clearExportMsg();
    } catch (err) {
      setExportMsg({ type: "error", text: err.message || "Export failed" });
      clearExportMsg();
    } finally {
      setExportingDb(null);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const activePath = location.pathname;

  const handleSelectDb = (dbName) => {
    if (selectedDatabase === dbName && !selectedCollection && activePath === "/") return;
    setSelectedDatabase(dbName);
    if (activePath !== "/") {
      navigate("/");
    }
  };

  const handleSelectColl = (dbName, collName) => {
    setSelectedCollection(dbName, collName);
    if (activePath !== "/") {
      navigate("/");
    }
  };

  const filteredDatabases = databases.filter((db) => {
    if (!filterText.trim()) return true;
    const matchDb = db.toLowerCase().includes(filterText.toLowerCase());
    const colls = collectionsMap[db] || [];
    const matchColl = colls.some((c) => c.name.toLowerCase().includes(filterText.toLowerCase()));
    return matchDb || matchColl;
  });

  return (
    <aside className="w-72 h-full bg-slate-50 border-r border-slate-200/90 flex flex-col justify-between select-none shrink-0 font-sans">
      {/* Upper Navigation & Tree Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Workspace Utility Switcher */}
        <div className="p-2 border-b border-slate-200/80 bg-white">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => navigate("/")}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all ${
                activePath === "/"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="Database & Collection Explorer"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 3.58 3 8 3s8-1 8-3V7M4 7c0 2 3.58 3 8 3s8-1 8-3M4 7c0-2 3.58-3 8-3s8 1 8 3m0 5c0 2-3.58 3-8 3s-8-1-8-3" />
              </svg>
              <span>Explorer</span>
            </button>

            <button
              onClick={() => navigate("/metrics")}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all relative ${
                activePath === "/metrics"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="Real-time Server Metrics"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Metrics</span>
            </button>

            <button
              onClick={() => navigate("/import")}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all relative ${
                activePath === "/import"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="Import & Export"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Backup</span>
            </button>

            {(!permissions || permissions.length === 0 || permissions.includes("user:view") || permissions.includes("*") || role?.toLowerCase().includes("admin") || role === "super_admin") && (
              <button
                onClick={() => navigate("/users")}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all relative ${
                  activePath === "/users"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                title="Users & Roles RBAC"
              >
                <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Users</span>
              </button>
            )}
          </div>
        </div>

        {/* Explorer Header & Controls */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Databases
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAuditModal(true)}
                className="p-1 rounded-md text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                title="Audit & Activity Log"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </button>
              <button
                onClick={() => setShowCreateDb(true)}
                className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title="Create Database"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => fetchDatabases()}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors"
                title="Refresh Databases"
              >
                <svg className={`w-3.5 h-3.5 ${loadingTree ? "animate-spin text-emerald-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search databases..."
              className="w-full pl-7 pr-6 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Database & Collection Tree List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {/* Feature 6: Pinned Collections Section */}
          {pinnedCollections && pinnedCollections.length > 0 && (
            <div className="mb-2 pb-2 border-b border-slate-200/80">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber-500 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Pinned ({pinnedCollections.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {pinnedCollections.map((p) => {
                  const isPinnedSelected = selectedDatabase === p.dbName && selectedCollection === p.collName;
                  return (
                    <div
                      key={`pinned-${p.dbName}-${p.collName}`}
                      onClick={() => handleSelectColl(p.dbName, p.collName)}
                      className={`group/pin flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                        isPinnedSelected
                          ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80"
                          : "border border-transparent text-slate-700 hover:bg-slate-200/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <svg className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="truncate font-medium">{p.collName}</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">({p.dbName})</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinCollection(p.dbName, p.collName);
                        }}
                        className="opacity-0 group-hover/pin:opacity-100 p-0.5 text-slate-400 hover:text-red-500 rounded transition-opacity"
                        title="Unpin"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {filteredDatabases.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {loadingTree ? "Loading databases..." : "No databases found"}
            </div>
          ) : (
            filteredDatabases.map((dbName) => {
              const isDbSelected = selectedDatabase === dbName;
              const colls = collectionsMap[dbName] || [];

              return (
                <div key={dbName} className="group/db">
                  {/* Database Node */}
                  <div
                    onClick={() => handleSelectDb(dbName)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer select-none outline-none border transition-colors ${
                      isDbSelected
                        ? "bg-emerald-50 text-emerald-800 font-semibold border-emerald-200/80"
                        : "border-transparent text-slate-700 hover:bg-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <svg className={`w-3.5 h-3.5 shrink-0 ${isDbSelected ? "text-emerald-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <ellipse cx="12" cy="6" rx="8" ry="3" strokeWidth={1.8} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
                      </svg>

                      <span className="truncate font-medium">{dbName}</span>

                      {/* Collection count tag */}
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full font-medium shrink-0 transition-colors ${
                          isDbSelected
                            ? "bg-emerald-200/70 text-emerald-900"
                            : "bg-slate-200/70 text-slate-600 group-hover/db:bg-slate-300/80"
                        }`}
                        title={`${colls.length} ${colls.length === 1 ? 'collection' : 'collections'}`}
                      >
                        {colls.length} {colls.length === 1 ? 'col' : 'cols'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Quick Actions Hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateCollDb(dbName);
                          setShowCreateColl(true);
                        }}
                        className="opacity-0 group-hover/db:opacity-100 p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-opacity outline-none focus:outline-none"
                        title="Add Collection"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportDatabase(dbName);
                        }}
                        disabled={exportingDb === dbName}
                        className="p-0.5 rounded transition-opacity outline-none focus:outline-none opacity-0 group-hover/db:opacity-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                        title="Export Database"
                      >
                        {exportingDb === dbName ? (
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDbToDelete(dbName);
                        }}
                        className="opacity-0 group-hover/db:opacity-100 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-opacity outline-none focus:outline-none"
                        title="Delete Database"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Export Notification */}
      {exportMsg && (
        <div className="px-3 pb-2">
          <div
            className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              exportMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 shrink-0 ${exportMsg.type === "success" ? "text-emerald-600" : "text-red-600"}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              {exportMsg.type === "success" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className="truncate">{exportMsg.text}</span>
          </div>
        </div>
      )}

      {/* Bottom User Profile Section */}
      <div className="p-2 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {username ? username.charAt(0) : "A"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 truncate">{username || "admin"}</p>
                <span className={`text-[9px] font-mono px-1 rounded font-semibold ${
                  isTcp
                    ? (tls ? "bg-emerald-100 text-emerald-800" : "bg-cyan-100 text-cyan-800")
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {isTcp ? (tls ? "TLS" : "TCP") : "HTTP"}
                </span>
                {noAuth && (
                  <span className="text-[9px] font-mono px-1 rounded font-semibold bg-amber-100 text-amber-800">
                    No Auth
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono capitalize">{role || "Super Admin"}</p>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Disconnect"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Database & Collection Modals */}
      <CreateDatabaseModal
        isOpen={showCreateDb}
        onClose={() => setShowCreateDb(false)}
        onDatabaseCreated={(newDb) => {
          addDatabaseLocally(newDb);
          setShowCreateDb(false);
        }}
      />

      <DeleteDatabaseModal
        isOpen={!!dbToDelete}
        dbName={dbToDelete || ""}
        onClose={() => setDbToDelete(null)}
        onConfirmDelete={() => {
          if (dbToDelete) removeDatabaseLocally(dbToDelete);
          setDbToDelete(null);
        }}
      />

      <CreateCollectionModal
        isOpen={showCreateColl}
        databaseName={createCollDb}
        onClose={() => setShowCreateColl(false)}
        onCollectionCreated={(collName) => {
          if (createCollDb) addCollectionLocally(createCollDb, collName);
          setShowCreateColl(false);
        }}
      />

      <DeleteCollectionModal
        isOpen={!!collToDelete}
        databaseName={collToDelete?.dbName || ""}
        collectionName={collToDelete?.collName || ""}
        onClose={() => setCollToDelete(null)}
        onCollectionDeleted={() => {
          if (collToDelete) removeCollectionLocally(collToDelete.dbName, collToDelete.collName);
          setCollToDelete(null);
        }}
      />
      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </aside>
  );
};

export default Sidebar;
