import { create } from "zustand";
import apiClient from "../api/client";

export const useDbStore = create((set, get) => ({
  databases: [],
  collectionsMap: {}, // { [dbName]: [ { name, count, size } ] }
  expandedDbs: {}, // { [dbName]: boolean }
  selectedDatabase: "",
  selectedCollection: "",
  activeTab: "documents", // 'documents' | 'query'
  loadingTree: false,
  treeError: null,

  setSelectedDatabase: (dbName) => {
    set({ selectedDatabase: dbName, selectedCollection: "" });
    if (dbName) {
      get().fetchCollections(dbName);
    }
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

      // Fetch collections for all databases in parallel so tags show collection counts
      if (list.length > 0) {
        Promise.all(list.map((db) => get().fetchCollections(db)));
      }

      // Automatically select first database if none selected (with empty collection so cards open)
      if (list.length > 0 && !get().selectedDatabase) {
        const firstDb = list[0];
        set({
          selectedDatabase: firstDb,
          selectedCollection: "",
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

  fetchCollections: async (dbName) => {
    if (!dbName) return [];
    try {
      const res = await apiClient.get(`/api/collection/all/?databaseName=${encodeURIComponent(dbName)}`);
      const data = res.data?.data || {};
      const list = Array.isArray(data.ListOfCollections) ? data.ListOfCollections : [];
      const metaStatus = Array.isArray(data.collectionMetaStatus) ? data.collectionMetaStatus : [];
      const sizeMap = Array.isArray(data.CollectionSizeMap) ? data.CollectionSizeMap : [];

      const formatted = list.map((collName) => {
        const meta = metaStatus.find((m) => m.name === collName || m.collectionName === collName) || {};
        const sizeEntry = sizeMap.find((s) => s.folderPath?.endsWith(`/${collName}`)) || {};
        return {
          name: collName,
          count: sizeEntry.fileCount ?? meta.totalDocuments ?? meta.count ?? 0,
          size: sizeEntry.size ?? meta.size ?? 0,
        };
      });

      set({
        collectionsMap: {
          ...get().collectionsMap,
          [dbName]: formatted,
        },
      });

      return formatted;
    } catch (err) {
      console.error(`Failed to fetch collections for ${dbName}:`, err);
      set({
        collectionsMap: {
          ...get().collectionsMap,
          [dbName]: [],
        },
      });
      return [];
    }
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
