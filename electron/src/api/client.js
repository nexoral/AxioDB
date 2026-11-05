import axios from "axios";
import { useConnectionStore } from "../store/connectionStore";
import { useAuthStore } from "../store/authStore";

const sanitizeHeaders = (rawHeaders) => {
  const result = {};
  if (!rawHeaders) return result;

  const headersObj = typeof rawHeaders.toJSON === "function" ? rawHeaders.toJSON() : rawHeaders;

  for (const [key, val] of Object.entries(headersObj)) {
    if (val !== undefined && val !== null && typeof val !== "object") {
      result[key] = String(val);
    }
  }
  return result;
};

/**
 * Strips raw URLs (e.g. http://127.0.0.1:27018/api/...) and internal route paths
 * from user-facing error messages to avoid leaking implementation details.
 */
const sanitizeErrorMessage = (msg) => {
  if (typeof msg !== "string") return "An unexpected error occurred.";
  let sanitized = msg
    .replace(/https?:\/\/[^\s),]+/gi, "")
    .replace(/Route\s+[A-Z]+:\s*\/[^\s]+(\s+not found)?/gi, "Requested endpoint not found")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return sanitized || "An unexpected error occurred.";
};

const customIpcAdapter = async (config) => {
  if (typeof window !== "undefined" && window.electronAPI?.request) {
    let fullUrl = config.url;
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://") && !fullUrl.startsWith("tcp://")) {
      const baseUrl = config.baseURL || useConnectionStore.getState().getBaseUrl();
      fullUrl = `${baseUrl.replace(/\/+$/, "")}/${fullUrl.replace(/^\/+/, "")}`;
    }

    try {
      const headers = sanitizeHeaders(config.headers);
      if (useConnectionStore.getState().protocol === "tcp" && useConnectionStore.getState().tls) {
        headers["x-axiodb-tls"] = "true";
      }

      const res = await window.electronAPI.request({
        url: fullUrl,
        method: config.method || "GET",
        headers,
        data: config.data,
        params: config.params,
        timeout: config.timeout,
      });

      const response = {
        data: res.data,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        config,
        request: {},
      };

      const validate = config.validateStatus || ((status) => status >= 200 && status < 300);
      if (validate(res.status)) {
        return response;
      }

      const rawMessage =
        res.data && typeof res.data === "object" && res.data.message
          ? String(res.data.message)
          : `Request failed with status code ${res.status}`;
      const message = sanitizeErrorMessage(rawMessage);

      const error = new axios.AxiosError(
        message,
        res.status === 401 ? "ERR_BAD_REQUEST" : undefined,
        config,
        {},
        response
      );
      return Promise.reject(error);
    } catch (err) {
      const rawMsg = err?.message || String(err);
      let cleanMsg = rawMsg;
      let code = "ERR_NETWORK";

      if (/ECONNREFUSED/i.test(rawMsg)) {
        cleanMsg = "Connection refused. Please ensure the AxioDB server is running and accessible.";
        code = "ECONNREFUSED";
      } else if (/ETIMEDOUT|timed out/i.test(rawMsg)) {
        cleanMsg = "Connection timed out. The server took too long to respond.";
        code = "ETIMEDOUT";
      } else if (/ENOTFOUND/i.test(rawMsg)) {
        cleanMsg = "Host not found. Please verify the hostname or IP address.";
        code = "ENOTFOUND";
      } else if (/ECONNRESET|socket hang up/i.test(rawMsg)) {
        cleanMsg = "Connection was reset by the server.";
        code = "ECONNRESET";
      } else {
        // Strip Electron IPC wrapper if present
        const match = rawMsg.match(/Error:\s*(.*)/);
        if (match) {
          cleanMsg = match[1];
        }
        cleanMsg = sanitizeErrorMessage(cleanMsg);
      }

      const axiosErr = new axios.AxiosError(
        cleanMsg,
        code,
        config,
        {},
        undefined
      );
      return Promise.reject(axiosErr);
    }
  }

  // Fallback to standard fetch/xhr in browser dev
  return axios.defaults.adapter(config);
};

const apiClient = axios.create({
  adapter: customIpcAdapter,
  withCredentials: true,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const connState = useConnectionStore.getState();
  const baseUrl = connState.getBaseUrl();
  config.baseURL = baseUrl;
  if (connState.protocol === "tcp" && connState.tls) {
    config.headers = config.headers || {};
    config.headers["x-axiodb-tls"] = "true";
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLogin = error.config?.url?.includes("/api/auth/login");
      if (!isLogin) {
        useAuthStore.getState().clearSession();
        useConnectionStore.getState().setConnectionError(
          error.response?.data?.message || "Session expired or unauthorized (401). Please log in again."
        );
      }
    } else if (!error.response && useConnectionStore.getState().isConnected) {
      // Network failure while in-app — mark latency as null
      useConnectionStore.getState().setPingLatency(null);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { customIpcAdapter, sanitizeHeaders, sanitizeErrorMessage };
