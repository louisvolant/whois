"use client";

import { useEffect } from "react";

/**
 * Client component that disables pinch-to-zoom and gesture zooming on mobile / PWA devices.
 */
export default function PwaZoomPrevention() {
  useEffect(() => {
    // 1. Prevent Safari gesture zooming (pinch-to-zoom)
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    // 2. Prevent double-tap to zoom while preserving normal touch interactions on inputs/buttons
    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement | null;
        const isInteractive =
          target &&
          (target.tagName === "BUTTON" ||
            target.tagName === "INPUT" ||
            target.tagName === "A" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT");
        if (!isInteractive) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    // 3. Prevent wheel zoom with ctrl/meta key (desktop pinch on trackpads)
    const preventCtrlWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("touchend", preventDoubleTap, { passive: false });
    window.addEventListener("wheel", preventCtrlWheel, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchend", preventDoubleTap);
      window.removeEventListener("wheel", preventCtrlWheel);
    };
  }, []);

  return null;
}
