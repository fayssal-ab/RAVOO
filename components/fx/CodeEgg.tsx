"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { QZINO_CODE } from "@/lib/constants";

// Secret: type the promo code (RAVO50) anywhere on the site. Casino chips
// rain down, the code is copied to the clipboard and a toast says so.
const SECRET = QZINO_CODE.toUpperCase();
const COLORS = ["#8dff4a", "#c3ff8f", "#9b6bff", "#ffd76a", "#d9e1dc"];

interface Rain { id: number; chips: { left: number; dx: number; r: number; d: number; delay: number; size: number; color: string }[] }

export function CodeEgg() {
  const [rain, setRain] = useState<Rain | null>(null);

  useEffect(() => {
    let buf = "";
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toUpperCase()).slice(-SECRET.length);
      if (buf !== SECRET) return;
      buf = "";
      navigator.clipboard?.writeText(QZINO_CODE).catch(() => {});
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const id = Date.now();
      setRain({
        id,
        chips: reduce ? [] : Array.from({ length: 36 }, (_, i) => ({
          left: (i * 29) % 100, dx: ((i * 53) % 120) - 60, r: 360 + ((i * 97) % 720), d: 1.8 + ((i * 7) % 12) / 10,
          delay: ((i * 13) % 18) / 20, size: 22 + ((i * 11) % 22), color: COLORS[i % COLORS.length],
        })),
      });
      setTimeout(() => setRain((r) => (r?.id === id ? null : r)), 4200);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {rain && (
        <motion.div key={rain.id} className="pointer-events-none fixed inset-0 z-[95] overflow-hidden" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {rain.chips.map((c, i) => (
            <span
              key={i}
              className="chip-fall absolute top-0 rounded-full"
              style={{
                left: `${c.left}%`, width: c.size, height: c.size, animationDelay: `${c.delay}s`,
                ["--d" as string]: `${c.d}s`, ["--dx" as string]: `${c.dx}px`, ["--r" as string]: `${c.r}deg`,
                background: `radial-gradient(circle, ${c.color} 0 38%, #040605 39% 46%, ${c.color} 47%)`,
                boxShadow: `0 0 14px ${c.color}`, border: "3px dashed rgb(4 6 5 / 0.55)",
              }}
            />
          ))}
          <motion.div
            className="absolute inset-x-0 top-24 flex justify-center px-4"
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="panel neon-frame is-on px-6 py-4 text-center">
              <p className="font-display text-3xl"><span className="chrome">You found it:</span> <span className="neon-text">{QZINO_CODE}</span></p>
              <p className="mt-1 text-sm text-muted">Copied. Paste it in Qzino&apos;s Bonus Hub for your $50 bonus.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
