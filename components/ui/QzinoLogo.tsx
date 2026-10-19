import Image from "next/image";

/** Qzino's official logo (public/media/qzino-logo.svg, from qzino.com). */
export function QzinoLogo({ className = "h-8 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/media/qzino-logo.svg" alt="Qzino" width={78} height={37} className={className} priority={priority} draggable={false} unoptimized />;
}
