import { create } from "zustand";

const STORAGE_KEY_SAVED = "axiodb_saved_connections";
const STORAGE_KEY_WELCOME = "axiodb_welcome_seen";

const loadSavedConnections = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadWelcomeStatus = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_WELCOME) === "true";
  } catch {
    return false;
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

  savedConnections: loadSavedConnections(),
  hasSeenWelcome: loadWelcomeStatus(),

  setConnectionParams: (params) => set((state) => ({ ...state, ...params })),

  setIsConnected: (isConnected) => set({ isConnected }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setConnectionError: (connectionError) => set({ connectionError }),
  setPingLatency: (pingLatency) => set({ pingLatency }),
  setServerVersion: (serverVersion) => set({ serverVersion }),

  setHasSeenWelcome: (hasSeenWelcome) => {
    try {
      localStorage.setItem(STORAGE_KEY_WELCOME, hasSeenWelcome ? "true" : "false");
    } catch {
      // ignore
    }
    set({ hasSeenWelcome });
  },

  saveConnection: (connection) => {
    const current = get().savedConnections;
    const existingIndex = current.findIndex((c) => c.id === connection.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = connection;
    } else {
      updated = [connection, ...current];
    }
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ savedConnections: updated });
  },

  deleteSavedConnection: (id) => {
    const updated = get().savedConnections.filter((c) => c.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
    } catch {
      // ignore
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
