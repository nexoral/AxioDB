import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App.tsx";
import "./index.css";

export const createRoot = ViteReactSSG({ routes });
