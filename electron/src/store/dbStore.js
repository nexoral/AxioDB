import { create } from "zustand";
import apiClient from "../api/client";

// Module-level cache to deduplicate in-flight requests and prevent race conditions
const inflightFetches = new Map();

export const useDbStore = create((set, get) => ({
  databases: [],
  collectionsMap: {}, // { [dbName]: [ { name, count, size } ] }
  loadingCollections: {}, // { [dbName]: boolean }
  pinnedCollections: [], // [ { dbName, collName } ]
  expandedDbs: {}, // { [dbName]: boolean }
  selectedDatabase: "",
  selectedCollection: "",
  activeTab: "documents", // 'documents' | 'query'
  loadingTree: false,
  treeError: null,

  loadPinnedCollections: async () => {
    if (window.electronAPI?.store?.getPinnedCollections) {
      try {
        const list = await window.electronAPI.store.getPinnedCollections();
        set({ pinnedCollections: list || [] });
      } catch (err) {
        console.error("Failed to load pinned collections:", err);
      }
    }
  },

  togglePinCollection: async (dbName, collName) => {
    if (!dbName || !collName) return;
    if (window.electronAPI?.store?.togglePinCollection) {
      try {
        const res = await window.electronAPI.store.togglePinCollection({ dbName, collName });
        if (res?.list) {
          set({ pinnedCollections: res.list });
        }
      } catch (err) {
        console.error("Failed to toggle pin collection:", err);
      }
    }
  },

  setSelectedDatabase: (dbName) => {
    if (!dbName) return;
    if (get().selectedDatabase === dbName && !get().selectedCollection) return;

    set({ selectedDatabase: dbName, selectedCollection: "" });
    get().fetchCollections(dbName);
  },

  setSelectedCollection: (dbName, collName) => {
    set({
      selectedDatabase: dbName,
      selectedCollection: collName,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleDbExpanded: (dbName) => {
    const isCurrentlyExpanded = !!get().expandedDbs[dbName];
    set({
      expandedDbs: {
        ...get().expandedDbs,
        [dbName]: !isCurrentlyExpanded,
      },
    });

    if (!isCurrentlyExpanded && !get().collectionsMap[dbName]) {
      get().fetchCollections(dbName);
    }
  },

  fetchDatabases: async () => {
    try {
      set({ loadingTree: true, treeError: null });
      const res = await apiClient.get("/api/db/databases");
      const data = res.data?.data || {};
      const list = Array.isArray(data.ListOfDatabases) ? data.ListOfDatabases : [];
      set({ databases: list, loadingTree: false });
      get().loadPinnedCollections();

      // Automatically select first database if none selected (with empty collection so cards open)
      if (list.length > 0 && !get().selectedDatabase) {
        const firstDb = list[0];
        set({
          selectedDatabase: firstDb,
          selectedCollection: "",
        });
      }

      // Fetch collections for all databases in parallel and batch update once to avoid rapid re-renders
      if (list.length > 0) {
        Promise.all(
          list.map(async (db) => {
            try {
              const collRes = await apiClient.get(`/api/collection/all/?databaseName=${encodeURIComponent(db)}`);
              const collData = collRes.data?.data || {};
              const collList = Array.isArray(collData.ListOfCollections) ? collData.ListOfCollections : [];
              const metaStatus = Array.isArray(collData.collectionMetaStatus) ? collData.collectionMetaStatus : [];
              const sizeMap = Array.isArray(collData.CollectionSizeMap) ? collData.CollectionSizeMap : [];

              const formatted = collList.map((collName) => {
                const meta = metaStatus.find((m) => m.name === collName || m.collectionName === collName) || {};
                const sizeEntry = sizeMap.find((s) => s.collectionName === collName || s.folderPath === collName || s.folderPath?.endsWith(`/${collName}`)) || {};
                return {
                  name: collName,
                  count: sizeEntry.fileCount ?? meta.totalDocuments ?? meta.count ?? 0,
                  size: sizeEntry.size ?? meta.size ?? 0,
                };
              });
              return { db, formatted };
            } catch {
              return { db, formatted: [] };
            }
          })
        ).then((results) => {
          const newMap = { ...get().collectionsMap };
          for (const { db, formatted } of results) {
            newMap[db] = formatted;
          }
          set({ collectionsMap: newMap });
        });
      }

      return list;
    } catch (err) {
      console.error("Failed to load databases:", err);
      set({
        loadingTree: false,
        treeError: err.response?.data?.message || "Failed to load databases",
      });
      return [];
    }
  },

  fetchCollections: async (dbName, force = false) => {
    if (!dbName) return [];

    // Deduplicate in-flight fetches for the same database
    if (!force && inflightFetches.has(dbName)) {
      return inflightFetches.get(dbName);
    }

    // Set loading flag only if not already loaded in memory to prevent screen flash
    if (!get().collectionsMap[dbName]) {
      set((state) => ({
        loadingCollections: { ...state.loadingCollections, [dbName]: true },
      }));
    }

    const fetchPromise = (async () => {
      try {
        const res = await apiClient.get(`/api/collection/all/?databaseName=${encodeURIComponent(dbName)}`);
        const data = res.data?.data || {};
        const list = Array.isArray(data.ListOfCollections) ? data.ListOfCollections : [];
        const metaStatus = Array.isArray(data.collectionMetaStatus) ? data.collectionMetaStatus : [];
        const sizeMap = Array.isArray(data.CollectionSizeMap) ? data.CollectionSizeMap : [];

        const formatted = list.map((collName) => {
          const meta = metaStatus.find((m) => m.name === collName || m.collectionName === collName) || {};
          const sizeEntry = sizeMap.find((s) => s.collectionName === collName || s.folderPath === collName || s.folderPath?.endsWith(`/${collName}`)) || {};
          return {
            name: collName,
            count: sizeEntry.fileCount ?? meta.totalDocuments ?? meta.count ?? 0,
            size: sizeEntry.size ?? meta.size ?? 0,
          };
        });

        set((state) => ({
          collectionsMap: {
            ...state.collectionsMap,
            [dbName]: formatted,
          },
          loadingCollections: {
            ...state.loadingCollections,
            [dbName]: false,
          },
        }));

        return formatted;
      } catch (err) {
        console.error(`Failed to fetch collections for ${dbName}:`, err);
        set((state) => ({
          collectionsMap: {
            ...state.collectionsMap,
            [dbName]: state.collectionsMap[dbName] || [],
          },
          loadingCollections: {
            ...state.loadingCollections,
            [dbName]: false,
          },
        }));
        return [];
      } finally {
        inflightFetches.delete(dbName);
      }
    })();

    inflightFetches.set(dbName, fetchPromise);
    return fetchPromise;
  },

  addDatabaseLocally: (dbName) => {
    const list = Array.from(new Set([...get().databases, dbName]));
    set({
      databases: list,
      selectedDatabase: dbName,
      selectedCollection: "",
      expandedDbs: { ...get().expandedDbs, [dbName]: true },
      collectionsMap: { ...get().collectionsMap, [dbName]: [] },
    });
  },

  removeDatabaseLocally: (dbName) => {
    const updated = get().databases.filter((d) => d !== dbName);
    const newCollectionsMap = { ...get().collectionsMap };
    delete newCollectionsMap[dbName];

    set({
      databases: updated,
      collectionsMap: newCollectionsMap,
      selectedDatabase: updated[0] || "",
      selectedCollection: "",
    });
  },

  addCollectionLocally: (dbName, collName) => {
    const current = get().collectionsMap[dbName] || [];
    const updated = [...current.filter((c) => c.name !== collName), { name: collName, count: 0, size: 0 }];
    set({
      collectionsMap: {
        ...get().collectionsMap,
        [dbName]: updated,
      },
      selectedDatabase: dbName,
      selectedCollection: collName,
    });
  },

  removeCollectionLocally: (dbName, collName) => {
    const current = get().collectionsMap[dbName] || [];
    const updated = current.filter((c) => c.name !== collName);
    set({
      collectionsMap: {
        ...get().collectionsMap,
        [dbName]: updated,
      },
      selectedCollection: updated[0]?.name || "",
    });
  },
}));
