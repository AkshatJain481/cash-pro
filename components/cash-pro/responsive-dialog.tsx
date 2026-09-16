"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

import { useMediaQuery } from "./hooks";

/**
 * Overlays focus their first field when they open. On touch screens that pops
 * up the keyboard over the content, so focus stays put there instead.
 */
export function preventAutoFocusOnTouch(event: Event) {
  if (window.matchMedia("(pointer: coarse)").matches) event.preventDefault();
}

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: string;
  className?: string;
  children: ReactNode;
};

/** A centered dialog on tablets and desktops, a bottom sheet on phones. */
export function ResponsiveDialog({ open, onOpenChange, title, description, className, children }: ResponsiveDialogProps) {
  const desktop = useMediaQuery("(min-width: 768px)");

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onOpenAutoFocus={preventAutoFocusOnTouch}
          className={cn("flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl", className)}
        >
          <DialogHeader className="border-b px-6 py-4 pr-14">
            <DialogTitle className="flex items-center gap-2 text-[17px] font-bold">{title}</DialogTitle>
            <DialogDescription className="text-xs">{description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        onOpenAutoFocus={preventAutoFocusOnTouch}
        className={cn("data-[vaul-drawer-direction=bottom]:max-h-[92dvh]", className)}
      >
        <DrawerHeader className="border-b pt-2 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="flex items-center gap-2 text-[17px] font-bold">{title}</DrawerTitle>
          <DrawerDescription className="text-xs">{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-2 py-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
