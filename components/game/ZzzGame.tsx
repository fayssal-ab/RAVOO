"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { SleepMask } from "@/components/decor/shapes";
import { useSiteReady } from "@/components/shell/siteReady";

// "Keep Ravo awake": sleepy things drift across the screen (Zzz bubbles,
// sleep masks). Click one to knock its HP down; the last hit pops it with a
// WAKE UP! and adds to your score (saved in this browser). Desktop only, the
// layer ignores the pointer except on the targets so the page stays usable.
// Positions move through refs (no 60fps re-render); paused while the tab is
// hidden and under prefers-reduced-motion. Ported from ONO's planet game.

type Kind = "zzz" | "mask";
interface Live { id: number; kind: Kind; size: number; x: number; y: number; vx: number; vy: number; hp: number; maxHp: number; wobble: number }
interface Boom { id: number; x: number; y: number; reward: number; word: string }

const WORDS = ["WAKE UP!", "NOT TODAY!", "NEVER SLEEPS!", "BANG!"];
const SPAWN_MS = 13000;
const MAX_ON_SCREEN = 2;
const SCORE_KEY = "ravo.awake";

function Target({ p }: { p: Live }) {
  if (p.kind === "mask") {
    return <SleepMask className="size-full text-[#141a16] drop-shadow-[0_0_12px_rgb(141_255_74/0.55)]" />;
  }
  return (
    <span className="grid size-full place-items-center rounded-full border-2 border-neon/60 bg-[radial-gradient(circle_at_35%_30%,rgb(195_255_143/0.35),rgb(10_30_10/0.85)_70%)] shadow-[0_0_28px_-4px_rgb(141_255_74/0.7),inset_0_0_18px_rgb(141_255_74/0.25)]">
      <span className="font-display leading-none text-neon-bright" style={{ fontSize: p.size * 0.32 }}>Zzz</span>
    </span>
  );
}

export function ZzzGame() {
  const ready = useSiteReady();
  const liveRef = useRef<Map<number, Live>>(new Map());
  const nodeRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const idRef = useRef(1);
  const [items, setItems] = useState<Live[]>([]);
  const [booms, setBooms] = useState<Boom[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      try { setScore(Number(localStorage.getItem(SCORE_KEY) || "0") || 0); } catch { /* ignore */ }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !window.matchMedia("(min-width: 1024px)").matches) return;

    const spawn = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const kind: Kind = Math.random() < 0.65 ? "zzz" : "mask";
      const size = kind === "zzz" ? 64 + Math.round(Math.random() * 30) : 96 + Math.round(Math.random() * 30);
      const maxHp = 2 + Math.floor(Math.random() * 3);
      const fromLeft = Math.random() < 0.5;
      const speed = 0.02 + Math.random() * 0.02; // px per ms
      const p: Live = {
        id: idRef.current++, kind, size,
        x: fromLeft ? -size : w + size,
        y: 110 + Math.random() * Math.max(80, h - size - 240),
        vx: fromLeft ? speed : -speed, vy: (Math.random() - 0.5) * 0.012,
        hp: maxHp, maxHp, wobble: Math.random() * Math.PI * 2,
      };
      liveRef.current.set(p.id, p);
      setItems((ps) => [...ps, p]);
    };

    const kickoff = setTimeout(() => { if (liveRef.current.size < MAX_ON_SCREEN) spawn(); }, 6000);
    const spawner = setInterval(() => { if (!document.hidden && liveRef.current.size < MAX_ON_SCREEN) spawn(); }, SPAWN_MS);

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(48, t - last);
      last = t;
      if (!document.hidden) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (const [id, p] of liveRef.current) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.wobble += dt * 0.003;
          if (p.y < 90 || p.y > h - p.size - 120) p.vy *= -1;
          const node = nodeRef.current.get(id);
          if (node) node.style.transform = `translate(${p.x}px, ${p.y + Math.sin(p.wobble) * 10}px) rotate(${Math.sin(p.wobble * 0.7) * 8}deg)`;
          if (p.x < -p.size - 90 || p.x > w + p.size + 90) {
            liveRef.current.delete(id);
            setItems((ps) => ps.filter((q) => q.id !== id));
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { clearTimeout(kickoff); clearInterval(spawner); cancelAnimationFrame(raf); };
  }, [ready]);

  function hit(id: number) {
    const p = liveRef.current.get(id);
    if (!p) return;
    p.hp -= 1;
    const node = nodeRef.current.get(id);
    if (node) {
      node.classList.remove("zzz-hit");
      void node.offsetWidth;
      node.classList.add("zzz-hit");
    }
    if (p.hp > 0) {
      setItems((ps) => ps.map((q) => (q.id === id ? { ...q, hp: p.hp } : q)));
      return;
    }
    const reward = p.maxHp * 10;
    const boomId = idRef.current++;
    setScore((s) => {
      const next = s + reward;
      try { localStorage.setItem(SCORE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
    setBooms((bs) => [...bs, { id: boomId, x: p.x + p.size / 2, y: p.y + p.size / 2, reward, word: WORDS[Math.floor(Math.random() * WORDS.length)] }]);
    setTimeout(() => setBooms((bs) => bs.filter((b) => b.id !== boomId)), 900);
    liveRef.current.delete(id);
    setItems((ps) => ps.filter((q) => q.id !== id));
  }

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 hidden overflow-hidden lg:block">
        {items.map((p) => (
          <button
            key={p.id}
            type="button"
            tabIndex={-1}
            aria-label="Pop it"
            onPointerDown={() => hit(p.id)}
            ref={(el) => {
              if (el) { nodeRef.current.set(p.id, el); el.style.transform = `translate(${p.x}px, ${p.y}px)`; }
              else nodeRef.current.delete(p.id);
            }}
            className="pointer-events-auto absolute left-0 top-0 cursor-crosshair will-change-transform"
            style={{ width: p.size, height: p.kind === "mask" ? p.size / 2 : p.size }}
          >
            <Target p={p} />
            <span className="pointer-events-none absolute -top-3 left-1/2 flex -translate-x-1/2 gap-0.5">
              {Array.from({ length: p.maxHp }).map((_, i) => (
                <span key={i} className="size-1.5 rounded-full" style={{ background: i < p.hp ? "var(--color-neon)" : "transparent", border: i < p.hp ? "none" : "1px solid var(--color-line-hot)" }} />
              ))}
            </span>
          </button>
        ))}
        {booms.map((b) => (
          <div key={b.id} className="absolute" style={{ left: b.x, top: b.y, transform: "translate(-50%,-50%)" }}>
            <div className="zzz-pop relative">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="zzz-shard absolute left-1/2 top-1/2 size-2 rounded-full bg-neon"
                  style={{ ["--sx" as string]: `${Math.cos((i / 10) * 6.28) * 110}px`, ["--sy" as string]: `${Math.sin((i / 10) * 6.28) * 110}px` }} />
              ))}
            </div>
            <span className="neon-text absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-4xl">{b.word}</span>
            <span className="absolute left-1/2 top-8 -translate-x-1/2 font-mono text-sm font-bold text-gold">+{b.reward}</span>
          </div>
        ))}
      </div>

      {score > 0 && (
        <div className="pointer-events-none fixed bottom-5 left-5 z-40 hidden lg:block" title="Sleepy things popped">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-bg/90 px-3 py-1.5 font-mono text-sm font-bold text-neon backdrop-blur">
            <Eye className="size-4" /> {score.toLocaleString("en-US")}
          </span>
        </div>
      )}
    </>
  );
}
