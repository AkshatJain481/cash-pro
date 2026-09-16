"use client";

import { useEffect, useState } from "react";

import { atLocalTime } from "@/lib/cash-pro/dates";

import { useCashProActions, useCashProStore } from "./store";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function playBeep() {
  try {
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
    oscillator.onended = () => void context.close();
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1);
  } catch {
    // Browsers may block audio until the user has interacted with the page.
  }
}

/**
 * Checks every minute for events starting in an hour and tasks due soon
 * (09:00 on the due date), showing a banner with a beep once for each.
 */
export function Reminders() {
  const store = useCashProStore();
  const actions = useCashProActions();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const show = (text: string) => {
      setMessage(text);
      playBeep();
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setMessage(null), 6000);
    };

    const check = () => {
      const now = Date.now();
      const { events, tasks } = store.getState();

      for (const event of events) {
        if (event.alerted) continue;
        const untilStart = atLocalTime(event.date, event.time).getTime() - now;
        // A small window so a late timer tick doesn't skip the reminder.
        if (untilStart > HOUR - 2 * MINUTE && untilStart <= HOUR) {
          void actions.setEventAlerted(event.id);
          show(`🔔 1 hour until: ${event.title} at ${event.time}`);
        }
      }

      for (const task of tasks) {
        if (task.alerted || task.status === "DONE" || !task.dueDate) continue;
        const untilDue = atLocalTime(task.dueDate, "09:00").getTime() - now;
        if (untilDue > 0 && untilDue <= HOUR) {
          void actions.setTaskAlerted(task.id);
          show(`⏰ Task due soon: ${task.title}`);
        }
      }
    };

    const firstCheck = setTimeout(check, 5000);
    const interval = setInterval(check, MINUTE);
    return () => {
      clearTimeout(firstCheck);
      clearInterval(interval);
      clearTimeout(hideTimer);
    };
  }, [store, actions]);

  if (!message) return null;

  return (
    <button
      type="button"
      role="alert"
      onClick={() => setMessage(null)}
      className="fixed top-[calc(env(safe-area-inset-top)+4.5rem)] left-1/2 z-[60] w-[90%] max-w-[340px] -translate-x-1/2 rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-xl animate-in fade-in slide-in-from-top-4"
    >
      {message}
    </button>
  );
}
