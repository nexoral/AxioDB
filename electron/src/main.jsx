import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";
import { useConnectionStore } from "./store/connectionStore";
import { useAuthStore } from "./store/authStore";
import { customIpcAdapter } from "./api/client";

// Global Axios configuration
axios.defaults.adapter = customIpcAdapter;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const baseUrl = useConnectionStore.getState().getBaseUrl();
  if (config.url && !config.url.startsWith("http://") && !config.url.startsWith("https://")) {
    config.url = `${baseUrl.replace(/\/+$/, "")}/${config.url.replace(/^\/+/, "")}`;
  }
  return config;
});

axios.interceptors.response.use(
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
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
