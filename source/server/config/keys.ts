import path from "path";

export enum ServerKeys {
  PORT = 27018,
  LOCALHOST = "127.0.1",
}

// Config for CORS
export const CORS_CONFIG = {
  ORIGIN: "*",
  METHODS: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  ALLOWED_HEADERS: ["Content-Type", "Authorization"],
  EXPOSED_HEADERS: ["Content-Length", "X-Requested-With"],
  MAX_AGE: 86400, // 24 hours in seconds
  ALLOW_CREDENTIALS: true,
};

export const staticPath = path.resolve(__dirname, "../public/AxioControl");

// Routes

export const AvailableRoutes = [
  {
    method: "GET",
    path: "/api/info",
    description: "To Get Internal Informations about this DB",
  },
  {
    method: "GET",
    path: "/api/health",
    description: "Health check endpoint to verify server status",
  },
  {
    method: "GET",
    path: "/api/routes",
    description: "List all available API routes",
  },
  {
    method: "GET",
    path: "/api/databases",
    description: "Get a list of all databases",
  },
  {
    method: "POST",
    path: "/api/create-database",
    description: "Create a new database",
    payload: {
      name: "string",
    },
  },
];
