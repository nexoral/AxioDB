export const isDevelopmentMode = import.meta.env.DEV; // Global Development Mode

export const BASE_API_URL = isDevelopmentMode
  ? "http://localhost:27018"
  : window.location.origin;
