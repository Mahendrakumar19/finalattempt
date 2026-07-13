/**
 * Enterprise Responsive Breakpoints
 * Single source of truth for all screen-size logic.
 *
 * Mobile  : < 768px
 * Tablet  : 768px – 1023px
 * Laptop  : 1024px – 1439px
 * Desktop : 1440px – 1919px
 * Ultra   : 1920px+
 */
"use client";

import { useEffect, useState, useCallback } from "react";

export const BP = {
  mobile: 768,
  tablet: 1024,
  laptop: 1440,
  desktop: 1920,
} as const;

export type Breakpoint = "mobile" | "tablet" | "laptop" | "desktop" | "ultra";

function getBreakpoint(width: number): Breakpoint {
  if (width < BP.mobile) return "mobile";
  if (width < BP.tablet) return "tablet";
  if (width < BP.laptop) return "laptop";
  if (width < BP.desktop) return "desktop";
  return "ultra";
}

/** Returns the current named breakpoint, live-updating on resize. */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== "undefined"
      ? getBreakpoint(window.innerWidth)
      : "desktop"
  );

  useEffect(() => {
    const update = () => setBp(getBreakpoint(window.innerWidth));
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return bp;
}

/** True when viewport < 768px (phone). */
export function useIsMobile(): boolean {
  const bp = useBreakpoint();
  return bp === "mobile";
}

/** True when viewport is 768–1023px (tablet). */
export function useIsTablet(): boolean {
  const bp = useBreakpoint();
  return bp === "tablet";
}

/** True when viewport < 1024px (phone or tablet). */
export function useIsMobileOrTablet(): boolean {
  const bp = useBreakpoint();
  return bp === "mobile" || bp === "tablet";
}

/** True when viewport ≥ 1024px (laptop/desktop/ultra). */
export function useIsDesktop(): boolean {
  const bp = useBreakpoint();
  return bp === "laptop" || bp === "desktop" || bp === "ultra";
}

/**
 * Returns a stable callback that reads the current window width without
 * subscribing to resize events. Useful for one-shot checks inside handlers.
 */
export function useGetBreakpoint(): () => Breakpoint {
  return useCallback(
    () =>
      typeof window !== "undefined"
        ? getBreakpoint(window.innerWidth)
        : "desktop",
    []
  );
}
