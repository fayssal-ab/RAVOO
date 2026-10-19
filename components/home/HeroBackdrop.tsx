"use client";

import Image from "next/image";
import { motion, useReducedMotion, type MotionValue } from "motion/react";

// Hero wallpaper: chrome spikes over green smoke. The card suits were lifted
// out of the artwork into their own sprites (public/media/hero/*.webp) and sit
// back on their original spots (percent of the 2400×1157 art), flipping like
// coins. The art box keeps its aspect ratio and covers the band, so the
// sprites stay aligned at every screen size.

const SUITS = [
  { k: "heartL", left: 4.38, top: 29.39, width: 8.71, height: 19.79, dur: 5.5, delay: 0 },
  { k: "diamond", left: 12.17, top: 68.02, width: 7.96, height: 22.47, dur: 4.2, delay: 1.1 },
  { k: "club", left: 26.71, top: 78.57, width: 8.71, height: 18.84, dur: 6.4, delay: 0.5 },
  { k: "spadeT", left: 62.13, top: 9.68, width: 8.13, height: 17.2, dur: 5, delay: 1.8 },
  { k: "heartR", left: 82.46, top: 45.46, width: 8.71, height: 20.92, dur: 6, delay: 0.8 },
  { k: "spadeB", left: 79.67, top: 71.13, width: 9.79, height: 22.3, dur: 4.6, delay: 2.4 },
] as const;

const MOBILE = [
  { k: "spadeT", left: "-5%", top: "13%", size: "6.5rem" },
  { k: "heartR", left: "78%", top: "8%", size: "6rem" },
  { k: "diamond", left: "84%", top: "50%", size: "6rem" },
  { k: "club", left: "-6%", top: "58%", size: "6.5rem" },
] as const;

type SuitDef = (typeof SUITS)[number];

function Suit({ s, reduce, style }: { s: SuitDef; reduce: boolean; style: React.CSSProperties }) {
  return (
    <motion.div
      aria-hidden
      className="absolute"
      style={style}
      animate={reduce ? undefined : { y: ["0%", "-6%", "0%"] }}
      transition={{ duration: s.dur * 0.9, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
    >
      <motion.div
        className="relative size-full drop-shadow-[0_0_18px_rgb(141_255_74/0.45)]"
        animate={reduce ? undefined : { rotateY: [0, 360] }}
        transition={{ duration: s.dur, repeat: Infinity, ease: [0.65, 0, 0.35, 1], repeatDelay: 1.2, delay: s.delay }}
      >
        <Image src={`/media/hero/${s.k}.webp`} alt="" fill sizes="220px" className="object-contain mix-blend-screen" />
      </motion.div>
    </motion.div>
  );
}

export function HeroBackdrop({ y }: { y: MotionValue<string> }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#040a05] [container-type:size]">
      <motion.div
        className="absolute left-1/2 top-0 aspect-[2400/1157] w-[max(100cqw,calc(100cqh*2400/1157))] -translate-x-1/2"
        style={{ y }}
      >
        <motion.div
          className="absolute inset-0"
          animate={reduce ? undefined : { scale: [1, 1.035, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/media/hero/bg.webp" alt="" fill priority quality={90} sizes="(max-width: 640px) 200vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 [perspective:900px]">
            {SUITS.map((s) => (
              <Suit key={s.k} s={s} reduce={!!reduce} style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%` }} />
            ))}
          </div>
          {/* neon breathing over the spikes */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgb(141_255_74/0.16),transparent_55%)]"
            animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
      {/* phones only see the middle of the art: bring a few suits in from the edges */}
      <div className="absolute inset-0 [perspective:700px] sm:hidden">
        {MOBILE.map((m) => {
          const s = SUITS.find((x) => x.k === m.k)!;
          return <Suit key={m.k} s={s} reduce={!!reduce} style={{ left: m.left, top: m.top, width: m.size, height: m.size }} />;
        })}
      </div>
      {/* keep the copy readable in the middle */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgb(4_10_5/0.55),transparent_60%)]" />
    </div>
  );
}
