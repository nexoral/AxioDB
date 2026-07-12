import { useEffect, useRef, useState } from "react";

interface UseTypewriterRevealOptions {
  threshold?: number;
  rootMargin?: string;
  /** Minimum animation duration in ms, regardless of snippet length. */
  minDurationMs?: number;
  /** Maximum animation duration in ms, regardless of snippet length. */
  maxDurationMs?: number;
}

interface UseTypewriterRevealResult<T extends HTMLElement> {
  ref: React.RefObject<T>;
  revealedCount: number;
}

const DEFAULT_MIN_DURATION_MS = 300;
const DEFAULT_MAX_DURATION_MS = 2200;
/** Baseline characters revealed per ms before the min/max duration clamp is applied. */
const BASE_CHARS_PER_MS = 0.12;

/**
 * Drives a one-time "typewriter" character count for a code snippet.
 *
 * SSR/first-paint safety: the initial value is the full snippet length on both
 * the server and the very first client render, so hydration always matches the
 * server-rendered markup (no React hydration mismatch, and crawlers/no-JS users
 * always see the complete text). Only after mount, once the element has scrolled
 * into view, does a client-only effect drop the count to 0 and animate it back up
 * via requestAnimationFrame.
 *
 * Plays once per distinct `code` value, not once per component mount: some pages
 * swap which snippet a single CodeBlock instance displays (e.g. a tab/example
 * switcher) without unmounting it, and each genuinely new snippet should still
 * get its own typewriter pass. Re-rendering with the same `code` (or switching
 * back to a snippet already shown) does not replay it.
 */
export function useTypewriterReveal<T extends HTMLElement = HTMLDivElement>(
  code: string,
  options?: UseTypewriterRevealOptions,
): UseTypewriterRevealResult<T> {
  const ref = useRef<T>(null);
  const [revealedCount, setRevealedCount] = useState(code.length);
  const lastAnimatedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current || code.length === 0) {
      return;
    }
    if (lastAnimatedCodeRef.current === code) {
      // Already played the typewriter for this exact snippet - just show it.
      setRevealedCount(code.length);
      return;
    }

    const el = ref.current;
    const totalChars = code.length;
    let frameId: number | null = null;

    const startTyping = () => {
      lastAnimatedCodeRef.current = code;
      setRevealedCount(0);

      const minDuration = options?.minDurationMs ?? DEFAULT_MIN_DURATION_MS;
      const maxDuration = options?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
      const duration = Math.min(maxDuration, Math.max(minDuration, totalChars / BASE_CHARS_PER_MS));
      const charsPerMs = totalChars / duration;
      let start: number | null = null;

      const tick = (timestamp: number) => {
        if (start === null) start = timestamp;
        const elapsed = timestamp - start;
        const next = Math.min(totalChars, Math.round(elapsed * charsPerMs));
        setRevealedCount(next);
        if (next < totalChars) {
          frameId = requestAnimationFrame(tick);
        }
      };

      frameId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el);
          startTyping();
        }
      },
      {
        threshold: options?.threshold ?? 0.2,
        rootMargin: options?.rootMargin ?? "0px 0px -80px 0px",
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return { ref, revealedCount };
}
