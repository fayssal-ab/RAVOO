"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// Imperative confirm in the site's own dialog: `await confirmDialog("…")`.
// <ConfirmHost/> must be mounted once (admin layout).
type Req = { text: string; resolve: (ok: boolean) => void };
let push: ((r: Req) => void) | null = null;

export function confirmDialog(text: string): Promise<boolean> {
  return new Promise((resolve) => (push ? push({ text, resolve }) : resolve(false)));
}

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null);
  useEffect(() => {
    push = setReq;
    return () => { push = null; };
  }, []);
  const close = (ok: boolean) => { req?.resolve(ok); setReq(null); };
  return (
    <AnimatePresence>
      {req && (
        <motion.div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
          <motion.div role="alertdialog" aria-modal="true" className="panel neon-frame is-on w-full max-w-md p-6"
            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-3xl"><span className="chrome">Sure?</span></p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{req.text}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => close(false)} autoFocus>Cancel</button>
              <button type="button" className="btn btn-neon btn-sm" onClick={() => close(true)}>Confirm</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
