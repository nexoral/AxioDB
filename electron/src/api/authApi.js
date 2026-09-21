import apiClient from "./client";
import { useConnectionStore } from "../store/connectionStore";

const authApi = {
  // Liveness & latency check
  ping: async (targetBaseUrl) => {
    const start = performance.now();
    const url = targetBaseUrl ? `${targetBaseUrl.replace(/\/+$/, "")}/api/health` : "/api/health";
    const res = await apiClient.get(url);
    const latency = Math.max(1, Math.round(performance.now() - start));
    const resultObj = { latency, success: true, ...(res.data || {}) };
    return { ...res, ...resultObj };
  },

  // Login supporting both (username, password) and ({ username, password })
  login: async (usernameOrObj, maybePassword) => {
    let username = usernameOrObj;
    let password = maybePassword;
    if (typeof usernameOrObj === "object" && usernameOrObj !== null) {
      username = usernameOrObj.username;
      password = usernameOrObj.password;
    }
    const res = await apiClient.post("/api/auth/login", { username, password });
    const userData = res.data?.data || {};
    return { ...res, ...userData };
  },

  logout: () => apiClient.post("/api/auth/logout"),
  fetchMe: () => apiClient.get("/api/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    apiClient.patch("/api/auth/change-password", { currentPassword, newPassword }),

  listUsers: () => apiClient.get("/api/auth/users"),
  createUser: (username, password, role) =>
    apiClient.post("/api/auth/users", { username, password, role }),
  updateUserRole: (username, role) =>
    apiClient.patch(`/api/auth/users/${encodeURIComponent(username)}/role`, { role }),
  resetUserPassword: (username, newPassword) =>
    apiClient.patch(`/api/auth/users/${encodeURIComponent(username)}/reset-password`, { newPassword }),
  deleteUser: (username) => apiClient.delete(`/api/auth/users/${encodeURIComponent(username)}`),

  listRoles: () => apiClient.get("/api/auth/roles"),
  createRole: (roleName, permissions) =>
    apiClient.post("/api/auth/roles", { roleName, permissions }),
  listPermissions: () => apiClient.get("/api/auth/roles/permissions"),

  // Direct probe alias
  checkHealth: (targetBaseUrl) => authApi.ping(targetBaseUrl),

  // Export a database as a tar.gz archive — uses native IPC in Electron for binary
  // streaming, with a browser blob-download fallback for web dev.
  exportDatabase: async (dbName) => {
    const baseUrl = useConnectionStore.getState().getBaseUrl();

    if (typeof window !== "undefined" && window.electronAPI?.exportDatabase) {
      return window.electronAPI.exportDatabase(dbName, baseUrl);
    }

    const response = await apiClient.get("/api/db/export-database/", {
      params: { dbName },
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"];
    const match = disposition?.match(/filename="(.+)"/);
    const downloadName = match ? match[1] : `${dbName}.tar.gz`;

    const url = window.URL.createObjectURL(new Blob([response.data], {
      type: response.headers["content-type"] || "application/gzip",
    }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { canceled: false, success: true, filePath: downloadName };
  },
};

export default authApi;
