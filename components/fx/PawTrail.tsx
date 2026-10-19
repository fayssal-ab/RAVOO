"use client";

import { useEffect, useRef } from "react";

// Desktop mouse trail: the pug's neon paw prints, stepping left/right along
// the cursor's path and fading out. A fixed pool of DOM nodes, moved by hand
// (no React re-render per step); off for touch screens and reduced motion.

const POOL = 16;
const STEP = 70; // px between prints
const PAW = "M50 50c11 0 25 12 25 25 0 9-7 14-15 14-5 0-7-3-10-3s-5 3-10 3c-8 0-15-5-15-14 0-13 14-25 25-25Z M24 44m-9 0a9 12 -24 1 0 18 0a9 12 -24 1 0 -18 0 M40 25m-9 0a9 13 -8 1 0 18 0a9 13 -8 1 0 -18 0 M60 25m-9 0a9 13 8 1 0 18 0a9 13 8 1 0 -18 0 M76 44m-9 0a9 12 24 1 0 18 0a9 12 24 1 0 -18 0";

export function PawTrail() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = layer.current;
    if (!root) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < POOL; i++) {
      const n = document.createElement("span");
      n.className = "paw-print";
      n.innerHTML = `<svg viewBox="0 0 100 100" width="22" height="22"><path fill="currentColor" d="${PAW}"/></svg>`;
      root.appendChild(n);
      nodes.push(n);
    }
    let next = 0;
    let left = false;
    let last: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < STEP) return;
      const angle = Math.atan2(dy, dx);
      left = !left;
      const off = left ? -9 : 9; // alternate feet across the path
      const x = e.clientX + Math.cos(angle + Math.PI / 2) * off;
      const y = e.clientY + Math.sin(angle + Math.PI / 2) * off;
      const n = nodes[next];
      next = (next + 1) % POOL;
      n.style.transform = `translate(${x - 11}px, ${y - 11}px) rotate(${angle + Math.PI / 2}rad)`;
      n.classList.remove("paw-step");
      void n.offsetWidth;
      n.classList.add("paw-step");
      last = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      nodes.forEach((n) => n.remove());
    };
  }, []);

  return <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" />;
}
