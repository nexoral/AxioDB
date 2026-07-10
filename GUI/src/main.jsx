import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import MainConfig from "./config/config.jsx";
import { useAuthStore } from "./store/authStore.js";

// Send/receive the session cookie on every request without touching each call site.
axios.defaults.withCredentials = true;

// Keep the auth store in sync when a session expires mid-use; the calling
// page's own .catch() still handles the rejected promise as before.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MainConfig />
  </StrictMode>,
);
