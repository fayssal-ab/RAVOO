"use client";

import { useEffect, useState } from "react";

// The preloader announces when it starts fading out so intro animations
// (hero reels, pug, title) play in front of the visitor instead of behind
// the loading screen.
declare global {
  interface Window { __ravoReady?: boolean }
}

export const READY_EVENT = "ravo:ready";

export function announceReady() {
  window.__ravoReady = true;
  window.dispatchEvent(new Event(READY_EVENT));
}

/** True once the preloader is fading out (or after a safety timeout). */
export function useSiteReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const go = () => setReady(true);
    if (window.__ravoReady) {
      const t = setTimeout(go, 0);
      return () => clearTimeout(t);
    }
    window.addEventListener(READY_EVENT, go, { once: true });
    const t = setTimeout(go, 9000);
    return () => { window.removeEventListener(READY_EVENT, go); clearTimeout(t); };
  }, []);
  return ready;
}
