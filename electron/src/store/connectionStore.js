import { create } from "zustand";

/**
 * Connection store — persisted via AxioDB embedded in the main process.
 *
 * localStorage is no longer used for saved connections or welcome state.
 * All persistence goes through IPC → main process → AxioDB files on disk.
 */

// Check if running inside Electron
const isElectron = typeof window !== "undefined" && window.electronAPI?.store;

/** Deduplicate connections by instance identity: name + host + port + username */
const deduplicateConnections = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Map();
  for (const conn of list) {
    if (!conn) continue;
    const key = `${conn.name?.trim().toLowerCase() || ""}@${conn.host}:${conn.port}:${conn.username || ""}`;
    if (!seen.has(key)) {
      seen.set(key, conn);
    } else {
      const prev = seen.get(key);
      seen.set(key, { ...prev, ...conn, id: prev.id || conn.id });
    }
  }
  return Array.from(seen.values());
};

/** Load saved connections from AxioDB (main process) or fallback to localStorage */
const loadSavedConnections = async () => {
  if (isElectron) {
    try {
      const conns = await window.electronAPI.store.getConnections();
      return deduplicateConnections(conns);
    } catch {
      return [];
    }
  }
  // Browser dev fallback (no Electron)
  try {
    const raw = localStorage.getItem("axiodb_saved_connections");
    return raw ? deduplicateConnections(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};

/** Load welcome status from AxioDB (main process) or fallback to localStorage */
const loadWelcomeStatus = async () => {
  if (isElectron) {
    try {
      const val = await window.electronAPI.store.getSetting("welcome_seen");
      return val === true || val === "true";
    } catch {
      return false;
    }
  }
  // Browser dev fallback
  try {
    return localStorage.getItem("axiodb_welcome_seen") === "true";
  } catch {
    return false;
  }
};

/** Save welcome status to AxioDB (main process) or fallback to localStorage */
const saveWelcomeStatus = async (seen) => {
  if (isElectron) {
    try {
      await window.electronAPI.store.setSetting("welcome_seen", seen);
    } catch {
      // ignore
    }
  } else {
    try {
      localStorage.setItem("axiodb_welcome_seen", seen ? "true" : "false");
    } catch {
      // ignore
    }
  }
};

export const useConnectionStore = create((set, get) => ({
  protocol: "http",
  host: "localhost",
  port: 27018,
  username: "admin",
  password: "",
  name: "Local Instance",

  isConnected: false,
  isConnecting: false,
  connectionError: null,
  pingLatency: null,
  serverVersion: null,

  savedConnections: [],
  hasSeenWelcome: true, // optimistic default, loaded async on init
  _loaded: false,

  /** Call once on app boot to hydrate from AxioDB */
  hydrate: async () => {
    const [connections, welcomeSeen] = await Promise.all([
      loadSavedConnections(),
      loadWelcomeStatus(),
    ]);
    set({
      savedConnections: connections,
      hasSeenWelcome: welcomeSeen,
      _loaded: true,
    });
  },

  setConnectionParams: (params) => set((state) => ({ ...state, ...params })),

  setIsConnected: (isConnected) => set({ isConnected }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setConnectionError: (connectionError) => set({ connectionError }),
  setPingLatency: (pingLatency) => set({ pingLatency }),
  setServerVersion: (serverVersion) => set({ serverVersion }),

  setHasSeenWelcome: (hasSeenWelcome) => {
    saveWelcomeStatus(hasSeenWelcome);
    set({ hasSeenWelcome });
  },

  saveConnection: async (connection) => {
    const current = get().savedConnections;
    const existingIndex = current.findIndex(
      (c) =>
        (connection.id && c.id === connection.id) ||
        (c.name?.trim().toLowerCase() === connection.name?.trim().toLowerCase() &&
          c.host === connection.host &&
          Number(c.port) === Number(connection.port)) ||
        (c.host === connection.host &&
          Number(c.port) === Number(connection.port) &&
          c.username === connection.username)
    );

    const targetConnection = { ...connection };
    let updated;
    if (existingIndex >= 0) {
      targetConnection.id = current[existingIndex].id || targetConnection.id;
      updated = [...current];
      updated[existingIndex] = { ...current[existingIndex], ...targetConnection };
    } else {
      updated = [targetConnection, ...current];
    }

    // Persist to AxioDB (main process)
    if (isElectron) {
      try {
        await window.electronAPI.store.saveConnection(targetConnection);
      } catch (err) {
        console.error("[ConnectionStore] Failed to persist connection:", err);
      }
    } else {
      // Browser dev fallback
      try {
        localStorage.setItem("axiodb_saved_connections", JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    set({ savedConnections: updated });
  },

  deleteSavedConnection: async (id) => {
    const updated = get().savedConnections.filter((c) => c.id !== id);

    // Persist to AxioDB (main process)
    if (isElectron) {
      try {
        await window.electronAPI.store.deleteConnection(id);
      } catch (err) {
        console.error("[ConnectionStore] Failed to delete connection:", err);
      }
    } else {
      try {
        localStorage.setItem("axiodb_saved_connections", JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    set({ savedConnections: updated });
  },

  getBaseUrl: () => {
    const { protocol, host, port } = get();
    return `${protocol}://${host}:${port}`;
  },

  disconnect: () => {
    if (window.electronAPI?.clearCookies) {
      window.electronAPI.clearCookies();
    }
    set({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      pingLatency: null,
    });
  },
}));
