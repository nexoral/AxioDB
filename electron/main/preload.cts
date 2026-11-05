import { contextBridge, ipcRenderer } from "electron";

export interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

export interface NetworkResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string | string[] | undefined>;
  data: T;
}

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,

  // Window Controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: (callback: (isMax: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMax: boolean) => callback(isMax);
    ipcRenderer.on("window:maximize-change", handler);
    return () => ipcRenderer.removeListener("window:maximize-change", handler);
  },

  // App & Shell
  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),

  // File picker & upload
  selectImportFile: () => ipcRenderer.invoke("dialog:selectImportFile"),
  readFileBuffer: (filePath: string) => ipcRenderer.invoke("file:readBuffer", filePath),
  uploadDatabase: (filePath: string, url: string) =>
    ipcRenderer.invoke("network:uploadDatabase", { filePath, url }),

  // Binary file download (export)
  exportDatabase: (dbName: string, baseUrl: string) =>
    ipcRenderer.invoke("network:exportDatabase", { dbName, baseUrl }),

  // Network IPC client
  request: (config: RequestConfig) => ipcRenderer.invoke("network:request", config),
  clearCookies: () => ipcRenderer.invoke("network:clearCookies"),

  // Local AxioDB storage (replaces localStorage)
  store: {
    getConnections: () => ipcRenderer.invoke("store:getConnections"),
    saveConnection: (connection: Record<string, unknown>) =>
      ipcRenderer.invoke("store:saveConnection", connection),
    deleteConnection: (id: string) => ipcRenderer.invoke("store:deleteConnection", id),
    getSetting: (key: string) => ipcRenderer.invoke("store:getSetting", key),
    setSetting: (key: string, value: unknown) =>
      ipcRenderer.invoke("store:setSetting", key, value),
    deleteSetting: (key: string) => ipcRenderer.invoke("store:deleteSetting", key),

    // Feature 1: Saved Queries
    saveQuerySnippet: (snippet: { id?: string; name: string; query: string; collection?: string; database?: string }) =>
      ipcRenderer.invoke("store:saveQuerySnippet", snippet),
    getSavedQueries: () => ipcRenderer.invoke("store:getSavedQueries"),
    deleteSavedQuery: (id: string) => ipcRenderer.invoke("store:deleteSavedQuery", id),

    // Feature 2: Query Execution History
    saveQueryHistory: (entry: { query: string; collection?: string; database?: string; durationMs?: number; status: string; error?: string }) =>
      ipcRenderer.invoke("store:saveQueryHistory", entry),
    getQueryHistory: (limit?: number) => ipcRenderer.invoke("store:getQueryHistory", limit),
    clearQueryHistory: () => ipcRenderer.invoke("store:clearQueryHistory"),

    // Feature 3: Audit Log & Activity Trail
    logActivity: (entry: { action: string; database?: string; collection?: string; details?: string; status?: string }) =>
      ipcRenderer.invoke("store:logActivity", entry),
    getAuditLogs: (limit?: number) => ipcRenderer.invoke("store:getAuditLogs", limit),
    clearAuditLogs: () => ipcRenderer.invoke("store:clearAuditLogs"),

    // Feature 5: Latency & Health Trend History
    recordPerformanceSample: (sample: { latency: number; storageMB?: number; cacheMB?: number }) =>
      ipcRenderer.invoke("store:recordPerformanceSample", sample),
    getPerformanceHistory: () => ipcRenderer.invoke("store:getPerformanceHistory"),

    // Feature 6: Pinned Collections
    getPinnedCollections: () => ipcRenderer.invoke("store:getPinnedCollections"),
    togglePinCollection: (item: { dbName: string; collName: string }) =>
      ipcRenderer.invoke("store:togglePinCollection", item),
  },
});
