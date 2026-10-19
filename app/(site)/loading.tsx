// Page-change loading: neon ring with the spinning pug (shown while a
// route's server data loads).
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center">
        <div className="relative size-24">
          <div className="absolute inset-0 rounded-full border-2 border-neon/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-neon border-r-violet/70 [animation-duration:0.9s] [filter:drop-shadow(0_0_8px_var(--color-neon))]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/pug-mascot.webp" alt="" draggable={false} className="absolute inset-3 m-auto size-[calc(100%-1.5rem)] animate-spin-slow object-contain [animation-duration:2.8s]" />
        </div>
        <p className="mt-4 font-pixel text-xs uppercase tracking-[0.3em] text-muted">Loading</p>
      </div>
    </div>
  );
}
