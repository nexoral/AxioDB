import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App.tsx";
import "./index.css";
import "./styles/global.css";

export const createRoot = ViteReactSSG({ routes });
