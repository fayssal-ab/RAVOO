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
          <div className="panel relative overflow-hidden p-4 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] sm:p-5">
            <div className="flex gap-3">
              <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon sm:grid"><Cookie className="size-5" /></span>
              <p className="min-w-0 text-sm leading-relaxed text-muted">
                <span className="font-head font-bold text-text">Cookies.</span> We use them to keep you signed in and remember your settings.{" "}
                <Link href="/privacy" className="text-neon underline underline-offset-2">Privacy Policy</Link>
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button type="button" onClick={() => choose("essential")} className="btn btn-ghost btn-sm">Essential only</button>
              <button type="button" onClick={() => choose("all")} className="btn btn-neon btn-sm">Accept all</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
