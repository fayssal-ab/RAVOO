"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Chip, Club, DripEdge, Spade } from "@/components/decor/shapes";
import { CopyCode } from "@/components/ui/CopyCode";

const TITLE = "NEVERSLEEPS".split("");

// Toastyy-style mascot band in RAVO's world: the dancing pug over a chrome
// spike backdrop, chips and suits orbiting, the name in metal chrome, and the
// band dripping slime into the page.
export function Hero({ code, qzinoUrl, pool }: { code: string; qzinoUrl: string; pool: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "25%"]);
  const pugY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 18 });
  const sy = useSpring(py, { stiffness: 70, damping: 18 });
  const near = { x: useTransform(sx, [-1, 1], [-26, 26]), y: useTransform(sy, [-1, 1], [-18, 18]) };
  const far = { x: useTransform(sx, [-1, 1], [12, -12]), y: useTransform(sy, [-1, 1], [8, -8]) };

  return (
    <section
      ref={ref}
      className="relative isolate -mt-[calc(var(--nav-h)+1.5rem)] pt-[calc(var(--nav-h)+2rem)]"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set(((e.clientX - r.left) / r.width) * 2 - 1);
        py.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => { px.set(0); py.set(0); }}
    >
      {/* band */}
      <div className="absolute inset-x-0 top-0 bottom-16 -z-10 overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#123d0c_0%,#0a2208_45%,#061505_100%)] sm:bottom-24">
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <Image src="/media/chrome-spikes.webp" alt="" fill priority sizes="100vw" className="object-cover object-top opacity-30 mix-blend-screen" />
        </motion.div>
        <div className="pixel-grid opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#061505]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 text-center sm:px-6 sm:pb-20">
        {/* mascot stage */}
        <motion.div style={{ y: pugY }} className="relative h-56 w-56 sm:h-72 sm:w-72">
          <motion.div aria-hidden className="absolute inset-6 rounded-full bg-neon/30 blur-3xl" animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.05, 0.95] }} transition={{ duration: 3.5, repeat: Infinity }} />
          {/* orbiting chips & suits (parallax with pointer) */}
          <motion.div aria-hidden style={far} className="absolute -left-16 top-6 sm:-left-28">
            <Chip className="size-16 animate-float text-neon drop-shadow-[0_0_14px_rgb(141_255_74/0.6)] sm:size-20" />
          </motion.div>
          <motion.div aria-hidden style={near} className="absolute -right-14 top-2 sm:-right-24">
            <Spade className="size-12 animate-float-slow rotate-12 text-silver drop-shadow-[0_0_10px_rgb(217_225_220/0.5)] sm:size-16" />
          </motion.div>
          <motion.div aria-hidden style={near} className="absolute -left-10 bottom-4 sm:-left-20">
            <Club className="size-10 animate-float-slow -rotate-12 text-neon/80 sm:size-14" />
          </motion.div>
          <motion.div aria-hidden style={far} className="absolute -right-12 bottom-10 sm:-right-24">
            <Chip className="size-12 animate-float text-violet drop-shadow-[0_0_12px_rgb(155_107_255/0.6)] sm:size-14" />
          </motion.div>
          <motion.div
            className="relative size-full"
            initial={{ opacity: 0, y: 60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.1 }}
          >
            <Image src="/media/pug-mascot.webp" alt="Ravo the pug" fill priority sizes="288px" className="animate-dance object-contain drop-shadow-[0_20px_40px_rgb(0_0_0/0.6)]" />
          </motion.div>
        </motion.div>

        <h1 className="mt-2 font-display leading-[0.82]">
          <motion.span
            className="chrome block text-[clamp(3.6rem,13vw,9.5rem)]"
            initial={{ opacity: 0, scale: 1.25, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          >
            RAVO
          </motion.span>
          <span className="block text-[clamp(1.9rem,7vw,5rem)]" aria-label="never sleeps">
            {TITLE.map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="neon-text inline-block"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.04, type: "spring", stiffness: 300, damping: 14 }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mx-auto mt-6 max-w-xl text-base text-text/80 sm:text-lg">
          Play on Qzino with code <span className="font-mono font-bold text-neon">{code}</span> for a <b>$50 bonus</b>, monthly wager leaderboards,
          milestones and a points store that pays you back.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25 }} className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <a href={qzinoUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-neon px-7 py-4 text-base">
            Play on Qzino <ArrowRight className="size-5" />
          </a>
          <CopyCode code={code} size="lg" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.45 }} className="mt-6">
          <Link href="/leaderboard" className="inline-flex items-center gap-2 font-head text-sm font-semibold uppercase tracking-[0.2em] text-text/70 transition hover:text-neon">
            <Trophy className="size-4 text-gold" />
            {pool ? <>{pool} monthly leaderboard · view</> : <>View the leaderboard</>}
          </Link>
        </motion.div>
      </div>

      {/* slime dripping into the page */}
      <div className="relative -mt-px h-16 sm:h-24" aria-hidden>
        <DripEdge className="absolute inset-0 size-full translate-y-[3px] text-neon/80" />
        <DripEdge className="absolute inset-0 size-full text-[#061505]" />
      </div>
    </section>
  );
}
