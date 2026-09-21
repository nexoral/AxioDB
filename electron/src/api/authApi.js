import apiClient from "./client";

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
};

export default authApi;
