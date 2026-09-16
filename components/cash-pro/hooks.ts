"use client";

import { useCallback, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** False during SSR and hydration, true once running in the browser. */
export function useMounted() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

/** A shared interval that notifies subscribers with a cached reading. */
function createTicker(intervalMs: number, read: () => number) {
  let value = read();
  let timer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!timer) {
        value = read();
        timer = setInterval(() => {
          value = read();
          listeners.forEach((notify) => notify());
        }, intervalMs);
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          clearInterval(timer);
          timer = undefined;
        }
      };
    },
    getSnapshot: () => value,
  };
}

const secondTicker = createTicker(1000, () => Date.now());
// Polls often but only changes (and re-renders) when the minute changes.
const minuteTicker = createTicker(15_000, () => Math.floor(Date.now() / 60_000) * 60_000);

/** The current time, ticking every second; null during SSR and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(secondTicker.subscribe, secondTicker.getSnapshot, () => null);
}

/** The current time floored to the minute. For client-rendered UI only. */
export function useMinute(): number {
  return useSyncExternalStore(minuteTicker.subscribe, minuteTicker.getSnapshot, minuteTicker.getSnapshot);
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
