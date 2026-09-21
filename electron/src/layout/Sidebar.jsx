import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useDbStore } from "../store/dbStore";
import { useConnectionStore } from "../store/connectionStore";
import CreateDatabaseModal from "../components/database/CreateDatabaseModal";
import DeleteDatabaseModal from "../components/database/DeleteDatabaseModal";
import CreateCollectionModal from "../components/collection/CreateCollectionModal";
import DeleteCollectionModal from "../components/collection/DeleteCollectionModal";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { username, role, permissions } = useAuthStore();
  const { disconnect } = useConnectionStore();
  const {
    databases,
    collectionsMap,
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

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const activePath = location.pathname;

  const handleSelectDb = (dbName) => {
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
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all ${
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
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all ${
                activePath === "/import"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="Import & Backup Restore"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import</span>
            </button>

            {(!permissions || permissions.includes("user:view")) && (
              <button
                onClick={() => navigate("/users")}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all ${
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
          {filteredDatabases.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {loadingTree ? "Loading databases..." : "No databases found"}
            </div>
          ) : (
            filteredDatabases.map((dbName) => {
              const isExpanded = !!expandedDbs[dbName];
              const isDbSelected = selectedDatabase === dbName && !selectedCollection;
              const colls = collectionsMap[dbName] || [];

              return (
                <div key={dbName} className="group/db">
                  {/* Database Node */}
                  <div
                    onClick={() => handleSelectDb(dbName)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                      isDbSelected
                        ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-2xs"
                        : "text-slate-700 hover:bg-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDbExpanded(dbName);
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-transform"
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <svg className={`w-3.5 h-3.5 shrink-0 ${isDbSelected ? "text-emerald-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <ellipse cx="12" cy="6" rx="8" ry="3" strokeWidth={1.8} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
                      </svg>

                      <span className="truncate font-medium">{dbName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1 rounded font-mono">
                        {colls.length}
                      </span>

                      {/* Quick Actions Hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateCollDb(dbName);
                          setShowCreateColl(true);
                        }}
                        className="opacity-0 group-hover/db:opacity-100 p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Add Collection"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDbToDelete(dbName);
                        }}
                        className="opacity-0 group-hover/db:opacity-100 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Database"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Collections List under Database */}
                  {isExpanded && (
                    <div className="ml-5 pl-2 border-l border-slate-200/70 space-y-0.5 my-0.5">
                      {colls.length === 0 ? (
                        <div className="py-1 px-2 text-[11px] text-slate-400 italic">
                          No collections
                        </div>
                      ) : (
                        colls.map((coll) => {
                          const isCollSelected = selectedDatabase === dbName && selectedCollection === coll.name;

                          return (
                            <div
                              key={coll.name}
                              onClick={() => handleSelectColl(dbName, coll.name)}
                              className={`group/coll flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-all ${
                                isCollSelected
                                  ? "bg-emerald-600 text-white font-medium shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <svg className={`w-3.5 h-3.5 shrink-0 ${isCollSelected ? "text-white" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate">{coll.name}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-mono px-1 rounded ${isCollSelected ? "bg-emerald-700 text-emerald-100" : "text-slate-400 bg-slate-200/60"}`}>
                                  {coll.count ?? 0}
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCollToDelete({ dbName, collName: coll.name });
                                  }}
                                  className={`opacity-0 group-hover/coll:opacity-100 p-0.5 rounded ${
                                    isCollSelected ? "text-emerald-200 hover:text-white" : "text-slate-400 hover:text-red-600"
                                  }`}
                                  title="Drop Collection"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-2 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {username ? username.charAt(0) : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{username || "admin"}</p>
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
    </aside>
  );
};

export default Sidebar;
