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

const customIpcAdapter = async (config) => {
  if (typeof window !== "undefined" && window.electronAPI?.request) {
    let fullUrl = config.url;
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      const baseUrl = config.baseURL || useConnectionStore.getState().getBaseUrl();
      fullUrl = `${baseUrl.replace(/\/+$/, "")}/${fullUrl.replace(/^\/+/, "")}`;
    }

    try {
      const res = await window.electronAPI.request({
        url: fullUrl,
        method: config.method || "GET",
        headers: sanitizeHeaders(config.headers),
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

      const message =
        res.data && typeof res.data === "object" && res.data.message
          ? String(res.data.message)
          : `Request failed with status code ${res.status}`;

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
        cleanMsg = `Connection refused (${fullUrl}). Please ensure the AxioDB server is running and the port is accessible.`;
        code = "ECONNREFUSED";
      } else if (/ETIMEDOUT|timed out/i.test(rawMsg)) {
        cleanMsg = `Connection timed out (${fullUrl}). The server took too long to respond.`;
        code = "ETIMEDOUT";
      } else if (/ENOTFOUND/i.test(rawMsg)) {
        cleanMsg = `Host not found (${fullUrl}). Please check the hostname or IP address.`;
        code = "ENOTFOUND";
      } else if (/ECONNRESET|socket hang up/i.test(rawMsg)) {
        cleanMsg = `Connection was reset by the server (${fullUrl}).`;
        code = "ECONNRESET";
      } else {
        // Strip Electron IPC wrapper if present
        const match = rawMsg.match(/Error:\s*(.*)/);
        if (match) {
          cleanMsg = match[1];
        }
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
  const baseUrl = useConnectionStore.getState().getBaseUrl();
  config.baseURL = baseUrl;
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
export { customIpcAdapter, sanitizeHeaders };
