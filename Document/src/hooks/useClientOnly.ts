import { useEffect, useState } from "react";

/**
 * SSR guard for client-only interactive effects (animation loops, event
 * listeners, rAF). Returns `false` during prerendering and hydration so the
 * static HTML matches the first client render; flips to `true` once the
 * effect runs. Gates every interactive diagram behind this so the scripts
 * that prerender each page (vite-react-ssg) never execute animation code and
 * no-JS clients still see fully-rendered content.
 */
export function useClientOnly(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}