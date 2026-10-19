import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { NAV_FLAT } from "@/lib/constants";

/** 404 content: the pug lost in the dream, plus quick links back into the site. */
export function NotFoundBody() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 text-center sm:px-6">
      <div className="relative mx-auto h-56 w-52">
        <div className="absolute inset-6 rounded-full bg-neon/20 blur-3xl" />
        <Image src="/media/ravo-mascot.webp" alt="" fill sizes="208px" className="animate-dance object-contain" />
      </div>
      <p className="mt-2 font-display text-[clamp(5rem,20vw,9rem)] leading-none"><span className="chrome">4</span><span className="neon-text">0</span><span className="chrome">4</span></p>
      <h1 className="mt-2 font-display text-4xl"><span className="chrome">Lost in</span> <span className="neon-text">the dream</span></h1>
      <p className="mx-auto mt-3 max-w-md text-muted">This page doesn&apos;t exist (or it fell asleep). The pug sniffed everywhere and found nothing.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-neon"><ArrowLeft className="size-4" /> Back home</Link>
        <Link href="/leaderboard" className="btn btn-ghost">Leaderboard</Link>
      </div>
      <div className="panel mx-auto mt-10 max-w-xl p-5 text-left">
        <p className="eyebrow mb-3 flex items-center gap-2"><Search className="size-4" /> Maybe you were looking for</p>
        <div className="flex flex-wrap gap-2">
          {NAV_FLAT.filter((n) => n.href !== "/").map((n) => (
            <Link key={n.href} href={n.href} className="chip text-muted transition hover:border-neon hover:text-neon">{n.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
