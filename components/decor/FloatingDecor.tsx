"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Chip, Club, Diamond, Paw, SleepMask, Spade } from "./shapes";

// Big tilted brand objects drifting at the page edges (the toastyy "floating
// toast" idea, in RAVO's world: paws, chips, suits, sleep masks). Each layer
// moves at its own scroll speed for depth. Positions are fixed so server and
// client render the same markup.

const SHAPES = { paw: Paw, chip: Chip, spade: Spade, club: Club, diamond: Diamond, mask: SleepMask };
type Kind = keyof typeof SHAPES;

interface Item { kind: Kind; top: string; left?: string; right?: string; size: number; rotate: number; speed: number; tone: "deep" | "neon" | "chrome"; delay: number }

const ITEMS: Item[] = [
  { kind: "paw", top: "6%", left: "-3%", size: 230, rotate: -24, speed: -120, tone: "deep", delay: 0 },
  { kind: "chip", top: "14%", right: "-2%", size: 170, rotate: 18, speed: -200, tone: "deep", delay: 1.2 },
  { kind: "spade", top: "34%", right: "4%", size: 90, rotate: 14, speed: -60, tone: "neon", delay: 0.6 },
  { kind: "mask", top: "44%", left: "-4%", size: 220, rotate: 16, speed: -160, tone: "deep", delay: 2 },
  { kind: "paw", top: "58%", right: "-4%", size: 260, rotate: 28, speed: -240, tone: "deep", delay: 0.9 },
  { kind: "diamond", top: "66%", left: "5%", size: 70, rotate: -12, speed: -90, tone: "neon", delay: 1.6 },
  { kind: "club", top: "80%", left: "-2%", size: 150, rotate: -18, speed: -180, tone: "chrome", delay: 0.3 },
  { kind: "chip", top: "88%", right: "6%", size: 110, rotate: -30, speed: -100, tone: "neon", delay: 2.4 },
];

const TONE = {
  deep: { color: "#0f1d11", filter: "drop-shadow(0 0 1.5px rgb(141 255 74 / .45)) drop-shadow(0 18px 40px rgb(0 0 0 / .6))" },
  neon: { color: "rgb(141 255 74 / .16)", filter: "drop-shadow(0 0 22px rgb(141 255 74 / .35))" },
  chrome: { color: "#1a221d", filter: "drop-shadow(0 0 1px rgb(217 225 220 / .5)) drop-shadow(0 18px 40px rgb(0 0 0 / .6))" },
};

function Floating({ item }: { item: Item }) {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : item.speed * 3]);
  const Shape = SHAPES[item.kind];
  const tone = TONE[item.tone];
  return (
    <motion.div className="absolute" style={{ top: item.top, left: item.left, right: item.right, y }}>
      <div
        className="animate-float"
        style={{ animationDelay: `${item.delay}s`, animationDuration: `${8 + item.delay * 2}s` }}
      >
        <Shape
          className="block"
          style={{ width: item.size, height: item.size, color: tone.color, filter: tone.filter, transform: `rotate(${item.rotate}deg)` }}
        />
      </div>
    </motion.div>
  );
}

export function FloatingDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden" aria-hidden>
      {ITEMS.map((it, i) => <Floating key={i} item={it} />)}
    </div>
  );
}
