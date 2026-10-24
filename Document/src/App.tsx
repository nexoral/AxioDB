import { StrictMode, lazy } from "react";
import type { RouteRecord } from "vite-react-ssg";
import Layout from "./components/layout/Layout";

// The 21 page components are code-split per route so the initial bundle only
// ships the code the current route needs (the home page no longer parses and
// evaluates every documentation page's code on every visit). Each file has a
// default export; vite-react-ssg awaits these during the prerender pass, so the
// statically generated HTML is complete. Suspense is handled in Layout.tsx.
const Introduction = lazy(() => import("./components/content/Introduction"));
const Features = lazy(() => import("./components/content/Features"));
const Limitations = lazy(() => import("./components/content/Limitations"));
const Installation = lazy(() => import("./components/content/Installation"));
const Usage = lazy(() => import("./components/content/Usage"));
const AdvancedFeatures = lazy(() => import("./components/content/AdvancedFeatures"));
const ApiReference = lazy(() => import("./components/content/ApiReference"));
const ServerApiReference = lazy(() => import("./components/content/ServerApiReference"));
const Security = lazy(() => import("./components/content/Security"));
const Community = lazy(() => import("./components/content/Community"));
const Comparison = lazy(() => import("./components/content/Comparison"));
const CreateDatabase = lazy(() => import("./components/content/CreateDatabase"));
const CreateCollection = lazy(() => import("./components/content/CreateCollection"));
const MaintainersZone = lazy(() => import("./components/content/MaintainersZone"));
const AxioDBCloud = lazy(() => import("./components/content/AxioDBCloud"));
const Cli = lazy(() => import("./components/content/Cli"));
const ControlGui = lazy(() => import("./components/content/ControlGui"));
const Docker = lazy(() => import("./components/content/Docker"));
const McpServer = lazy(() => import("./components/content/McpServer"));
const Troubleshooting = lazy(() => import("./components/content/Troubleshooting"));
const Changelog = lazy(() => import("./components/content/Changelog"));
const Performance = lazy(() => import("./components/content/Performance"));
const NotFound = lazy(() => import("./components/content/NotFound"));

// Route table consumed by vite-react-ssg to know which pages to prerender at
// build time, and by react-router-dom at runtime for client-side navigation.
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: (
      <StrictMode>
        <Layout />
      </StrictMode>
    ),
    children: [
      { index: true, element: <Introduction /> },
      { path: "features", element: <Features /> },
      { path: "limitations", element: <Limitations /> },
      { path: "installation", element: <Installation /> },
      { path: "usage", element: <Usage /> },
      { path: "advanced-features", element: <AdvancedFeatures /> },
      { path: "api-reference", element: <ApiReference /> },
      { path: "server-api", element: <ServerApiReference /> },
      { path: "security", element: <Security /> },
      { path: "community", element: <Community /> },
      { path: "comparison", element: <Comparison /> },
      { path: "create-database", element: <CreateDatabase /> },
      { path: "create-collection", element: <CreateCollection /> },
      { path: "cloud", element: <AxioDBCloud /> },
      { path: "cli", element: <Cli /> },
      { path: "gui", element: <ControlGui /> },
      { path: "docker", element: <Docker /> },
      { path: "mcp-server", element: <McpServer /> },
      { path: "troubleshooting", element: <Troubleshooting /> },
      { path: "changelog", element: <Changelog /> },
      { path: "performance", element: <Performance /> },
      { path: "maintainers-zone", element: <MaintainersZone /> },
      { path: "why-choose-axiodb", element: <Introduction /> },
      // Explicit route so vite-react-ssg emits a real /404.html, which
      // functions/_middleware.js serves with a 404 status. The catch-all below
      // only runs client-side after hydration - the SSG pass has no path to
      // prerender it from.
      { path: "404", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
