"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

import { useSidebar } from "@/components/ui/sidebar";

/** How long the mouse has to rest on the collapsed sidebar before it expands. */
const OPEN_DELAY = 200;
/** Grace period after the mouse leaves, so brushing past the edge doesn't snap it shut. */
const CLOSE_DELAY = 300;

const INTERACTIVE = "button, a, input, select, textarea, [role='menuitem']";

/**
 * Lets the icon-collapsed sidebar expand over the page without moving it,
 * after hovering for a moment or clicking an empty part of it. It collapses
 * again once the mouse leaves, on a click or tap elsewhere, or after choosing
 * an item by touch. Spread `handlers` on `<Sidebar>`.
 */
export function useSidebarPeek() {
  const { open, isMobile, peeking, setPeeking } = useSidebar();
  const timer = useRef<number | undefined>(undefined);
  const hovering = useRef(false);
  const holding = useRef(false);
  const lastPointer = useRef("mouse");
  const enabled = !open && !isMobile;

  function schedule(next: boolean, delay: number) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeeking(next), delay);
  }

  function hide() {
    window.clearTimeout(timer.current);
    setPeeking(false);
  }

  useEffect(() => {
    if (!peeking) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (holding.current) return;
      if (event.target instanceof Element && event.target.closest("[data-slot='sidebar-container']")) return;
      window.clearTimeout(timer.current);
      setPeeking(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [peeking, setPeeking]);

  const handlers = {
    onPointerEnter(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      hovering.current = true;
      if (peeking) window.clearTimeout(timer.current);
      else if (enabled) schedule(true, OPEN_DELAY);
    },
    onPointerLeave(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      hovering.current = false;
      if (!peeking) window.clearTimeout(timer.current);
      else if (!holding.current) schedule(false, CLOSE_DELAY);
    },
    onPointerDown(event: PointerEvent) {
      lastPointer.current = event.pointerType;
    },
    onClick(event: MouseEvent) {
      if (!enabled || peeking) return;
      if (event.target instanceof Element && !event.target.closest(INTERACTIVE)) {
        window.clearTimeout(timer.current);
        setPeeking(true);
      }
    },
  };

  return {
    handlers,
    /** Collapse right away, e.g. when a dialog opens from the sidebar. */
    hide,
    /** After navigating: touch has no "mouse leave", so collapse right away. */
    afterSelect() {
      if (peeking && lastPointer.current !== "mouse") hide();
    },
    /** Keep it expanded while a menu opened from it is showing. */
    hold(active: boolean) {
      holding.current = active;
      if (!active && peeking && !hovering.current) schedule(false, CLOSE_DELAY);
    },
  };
}
