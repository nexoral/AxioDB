import { useConnectionStore } from "../store/connectionStore";

export const isDevelopmentMode = import.meta.env.DEV;

// When set to empty string, all relative API paths `/api/...` are resolved
// against the active connection Base URL in axios request interceptors.
export const BASE_API_URL = "";

export const getActiveBaseUrl = () => {
  return useConnectionStore.getState().getBaseUrl();
};
