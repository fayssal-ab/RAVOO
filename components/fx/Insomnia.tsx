"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SleepMask } from "@/components/decor/shapes";

// Easter egg: Ravo never sleeps, but the site tries to. After a while with no
// input the page dims, Zzz drift up and a sleep mask slides down; the first
// move/tap/key tears the mask off with "I NEVER SLEEP!". Skipped on the
// stream page (people watch without touching anything), under reduced motion,
// and it waits longer each time so it never nags.

const FIRST_IDLE_MS = 25_000;
const LATER_IDLE_MS = 120_000;

export function Insomnia() {
  const pathname = usePathname();
  const [state, setState] = useState<"awake" | "dozing" | "waking">("awake");
  const stateRef = useRef(state);
  const times = useRef(0);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (pathname.startsWith("/stream")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    let wakeTimer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.hidden) return arm();
        setState("dozing");
      }, times.current === 0 ? FIRST_IDLE_MS : LATER_IDLE_MS);
    };
    const onInput = () => {
      if (stateRef.current === "dozing") {
        times.current += 1;
        setState("waking");
        document.body.classList.add("jolt");
        wakeTimer = setTimeout(() => { document.body.classList.remove("jolt"); setState("awake"); }, 1500);
      }
      if (stateRef.current !== "waking") arm();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    for (const e of events) window.addEventListener(e, onInput, { passive: true });
    arm();
    return () => {
      clearTimeout(timer);
      if (wakeTimer) clearTimeout(wakeTimer);
      for (const e of events) window.removeEventListener(e, onInput);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {state !== "awake" && (
        <motion.div
          key="insomnia"
          className="pointer-events-none fixed inset-0 z-[85] grid place-items-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 2.5 }}
          aria-hidden
        >
          {/* the lights go down */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(4_6_5/0.55),rgb(0_0_0/0.92))]"
            animate={{ opacity: state === "waking" ? 0 : 1 }}
            transition={{ duration: state === "waking" ? 0.3 : 2.5 }}
          />
          {/* Zzz drifting up */}
          {state === "dozing" && Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="zzz-rise absolute bottom-[-10%] font-display text-neon/70"
              style={{ left: `${12 + ((i * 37) % 76)}%`, fontSize: `${1.6 + (i % 3) * 0.9}rem`, animationDelay: `${(i * 0.7) % 5}s`, animationDuration: `${6 + (i % 4)}s` }}
            >
              Z
            </span>
          ))}
          <div className="relative flex flex-col items-center px-6 text-center">
            {/* the mask comes down, then gets torn off */}
            <motion.div
              initial={{ y: "-60vh", rotate: -8 }}
              animate={state === "waking" ? { y: "-80vh", rotate: 25, scale: 1.2 } : { y: 0, rotate: [-8, 4, -2, 0] }}
              transition={state === "waking" ? { duration: 0.45, ease: "easeIn" } : { duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <SleepMask className="h-auto w-[min(70vw,26rem)] text-[#0f1611] drop-shadow-[0_0_30px_rgb(141_255_74/0.4)]" />
            </motion.div>
            {state === "dozing" ? (
              <motion.p className="mt-6 font-display text-4xl sm:text-5xl" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} transition={{ delay: 1.6, duration: 2 }}>
                <span className="chrome">Ravo is dozing</span> <span className="neon-text">off…</span>
              </motion.p>
            ) : (
              <motion.p
                className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[clamp(3rem,11vw,7rem)] leading-none"
                initial={{ scale: 3, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
              >
                <span className="chrome">I NEVER</span> <span className="neon-text">SLEEP!</span>
              </motion.p>
            )}
            {state === "dozing" && (
              <motion.p className="mt-3 font-pixel text-xs uppercase tracking-[0.25em] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
                move anything to wake him up
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
