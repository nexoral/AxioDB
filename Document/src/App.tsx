import { StrictMode } from "react";
import type { RouteRecord } from "vite-react-ssg";
import Layout from "./components/layout/Layout";
import Introduction from "./components/content/Introduction";
import Features from "./components/content/Features";
import Limitations from "./components/content/Limitations";
import Installation from "./components/content/Installation";
import Usage from "./components/content/Usage";
import AdvancedFeatures from "./components/content/AdvancedFeatures";
import ApiReference from "./components/content/ApiReference";
import ServerApiReference from "./components/content/ServerApiReference";
import Security from "./components/content/Security";
import Community from "./components/content/Community";
import Comparison from "./components/content/Comparison";
import CreateDatabase from "./components/content/CreateDatabase";
import CreateCollection from "./components/content/CreateCollection";
import MaintainersZone from "./components/content/MaintainersZone";
import AxioDBCloud from "./components/content/AxioDBCloud";
import Docker from "./components/content/Docker";
import Troubleshooting from "./components/content/Troubleshooting";

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
      { path: "docker", element: <Docker /> },
      { path: "troubleshooting", element: <Troubleshooting /> },
      { path: "maintainers-zone", element: <MaintainersZone /> },
      { path: "why-choose-axiodb", element: <Introduction /> },
    ],
  },
];

export default routes;
