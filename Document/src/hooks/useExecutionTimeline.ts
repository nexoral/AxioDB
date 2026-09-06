import { useCallback, useEffect, useRef, useState } from "react";
import type { Scenario } from "../components/execution/ExecutionTypes";

export const DEFAULT_FRAME_MS = 1600;

export interface TimelineCursor {
  step: number;
  frame: number;
}

/**
 * Playback engine for an animated execution scenario.
 *
 * Walks `scenario.steps[step].frames[frame]` using a self-chaining timeout so
 * each frame's own `duration` (scaled by playback `speed`) decides when the
 * next frame starts. Manual controls (next/prev/goto) mutate the same cursor
 * the chain reads, so stepping by hand and playing interleave cleanly.
 *
 * All state is kept in refs where the render cycle doesn't care about it; the
 * only reactive states are the cursor, `playing`, and `speed`.
 */
export function useExecutionTimeline(scenario: Scenario) {
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;

  const [cursor, setCursor] = useState<TimelineCursor>({ step: 0, frame: 0 });
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const stateRef = useRef<TimelineCursor>({ step: 0, frame: 0 });
  const playingRef = useRef(false);
  const speedRef = useRef(1);

  const totalSteps = scenario.steps.length;
  const totalFrames = scenario.steps.reduce((sum, step) => sum + step.frames.length, 0);

  const currentStep = scenario.steps[Math.min(cursor.step, totalSteps - 1)];
  const currentFrame =
    currentStep.frames[Math.min(cursor.frame, currentStep.frames.length - 1)];

  const frameIndex = scenario.steps
    .slice(0, cursor.step)
    .reduce((sum, step) => sum + step.frames.length, 0) + cursor.frame;

  const firstInStep = cursor.frame === 0;
  const isFirst = frameIndex === 0;
  const isLast = frameIndex >= totalFrames - 1;

  const applyCursor = useCallback((next: TimelineCursor) => {
    stateRef.current = next;
    setCursor(next);
  }, []);

  // Self-chaining playback loop. Recreated only when `playing` flips; it reads
  // the latest cursor/speed/scenario from refs on every tick so a manual
  // `nextFrame()` or `setSpeed()` mid-play carries over seamlessly.
  useEffect(() => {
    if (!playing) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (cancelled) return;
      const { step, frame } = stateRef.current;
      const sc = scenarioRef.current;
      const stepFrames = sc.steps[step].frames;
      const active = stepFrames[frame];
      const duration = (active.duration ?? DEFAULT_FRAME_MS) / speedRef.current;

      timer = setTimeout(() => {
        if (cancelled) return;

        let nextStep = step;
        let nextFrame = frame + 1;
        if (nextFrame >= stepFrames.length) {
          nextStep = step + 1;
          nextFrame = 0;
          if (nextStep >= sc.steps.length) {
            setPlaying(false);
            playingRef.current = false;
            return;
          }
        }

        stateRef.current = { step: nextStep, frame: nextFrame };
        setCursor({ step: nextStep, frame: nextFrame });
        tick();
      }, duration);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [playing]);

  const togglePlay = useCallback(() => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }, []);

  const play = useCallback(() => {
    playingRef.current = true;
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const nextFrame = useCallback(() => {
    const { step, frame } = stateRef.current;
    const sc = scenarioRef.current;
    const stepFrames = sc.steps[step].frames;

    let nextStep = step;
    let nextFrame = frame + 1;
    if (nextFrame >= stepFrames.length) {
      nextStep = step + 1;
      nextFrame = 0;
      if (nextStep >= sc.steps.length) {
        return; // already at the very end
      }
    }
    applyCursor({ step: nextStep, frame: nextFrame });
  }, [applyCursor]);

  const prevFrame = useCallback(() => {
    const { step, frame } = stateRef.current;
    if (frame > 0) {
      applyCursor({ step, frame: frame - 1 });
      return;
    }
    if (step > 0) {
      const prevStep = scenarioRef.current.steps[step - 1];
      applyCursor({ step: step - 1, frame: prevStep.frames.length - 1 });
    }
  }, [applyCursor]);

  const gotoStep = useCallback(
    (index: number) => {
      const safe = Math.max(0, Math.min(index, scenarioRef.current.steps.length - 1));
      applyCursor({ step: safe, frame: 0 });
    },
    [applyCursor],
  );

  const restart = useCallback(() => {
    applyCursor({ step: 0, frame: 0 });
  }, [applyCursor]);

  const changeSpeed = useCallback((value: number) => {
    speedRef.current = value;
    setSpeed(value);
  }, []);

  return {
    scenario,
    cursor,
    frameIndex,
    totalSteps,
    totalFrames,
    currentStep,
    currentFrame,
    stepTitle: firstInStep ? currentStep.title : null,
    firstInStep,
    isFirst,
    isLast,
    playing,
    speed,
    togglePlay,
    play,
    pause,
    nextFrame,
    prevFrame,
    gotoStep,
    restart,
    changeSpeed,
  };
}