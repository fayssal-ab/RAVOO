"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

// A number that lands like the hero's slot reels: every digit is a 0-9
// strip that spins down and stops on its value, left to right, when it
// scrolls into view. Separators ($ , .) stay put.
export function ReelNumber({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const chars = value.split("");
  let digitIndex = 0;
  return (
    <span ref={ref} className={`inline-flex tabular-nums ${className}`} aria-label={value}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} aria-hidden>{ch}</span>;
        const d = Number(ch);
        const order = digitIndex++;
        // two full turns, then the digit
        const strip = [...Array(20).keys()].map((n) => n % 10).concat(d);
        return (
          <span key={i} className="reel-digit" aria-hidden>
            <motion.span
              initial={{ y: 0 }}
              animate={inView ? { y: `-${strip.length - 1}em` } : { y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 1.1 + order * 0.12, ease: [0.2, 0.8, 0.25, 1.04], delay: 0.1 }}
            >
              {strip.map((n, k) => <span key={k}>{n}</span>)}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
