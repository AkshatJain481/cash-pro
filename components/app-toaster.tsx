"use client";

import { useMediaQuery } from "@/components/cash-pro/hooks";
import { Toaster } from "@/components/ui/sonner";

/** Bottom-right on desktop; above the bottom navigation on phones. */
export function AppToaster() {
  const desktop = useMediaQuery("(min-width: 768px)");

  return (
    <Toaster
      position={desktop ? "bottom-right" : "bottom-center"}
      offset={desktop ? 24 : { bottom: 96 }}
      mobileOffset={{ bottom: 96 }}
    />
  );
}
