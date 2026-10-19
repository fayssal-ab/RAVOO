"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

// Cookie notice. The site only sets essential cookies (sign-in sessions);
// the choice is remembered in the `ravo_consent` cookie for a year so
// optional ones can respect it if any are added later.
const COOKIE = "ravo_consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const decided = document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`));
    if (decided) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  const choose = (value: "all" | "essential") => {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookies"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl sm:bottom-5"
        >
          <div className="panel neon-frame is-on relative overflow-hidden p-5 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] sm:p-6">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon"><Cookie className="size-6" /></span>
              <div className="min-w-0">
                <p className="font-head text-lg font-bold uppercase tracking-wide">We use cookies</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Cookies keep you signed in and remember your settings. Accept all, or keep only the essential ones. Details in our{" "}
                  <Link href="/privacy" className="text-neon underline-offset-2 hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => choose("essential")} className="btn btn-ghost btn-sm">Essential only</button>
              <button type="button" onClick={() => choose("all")} className="btn btn-neon btn-sm">Accept all</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
