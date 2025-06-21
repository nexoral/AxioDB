import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MainConfig from "./config/config.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MainConfig />
  </StrictMode>,
);
