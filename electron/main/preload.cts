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
  },
});
