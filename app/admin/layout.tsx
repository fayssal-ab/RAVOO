import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/account/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { ConfirmHost } from "@/components/ui/confirm";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-bg-2 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 p-4 lg:block">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/media/ravo-avatar.webp" alt="" width={40} height={40} className="rounded-full ring-2 ring-neon/40" />
            <span className="font-display text-xl"><span className="chrome">RAVO</span> <span className="neon-text">admin</span></span>
          </Link>
          <div className="lg:mt-6"><AdminNav /></div>
        </div>
        <div className="hidden p-4 lg:absolute lg:bottom-0 lg:block"><LogoutButton endpoint="/api/auth/logout" to="/login" /></div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      <ConfirmHost />
    </div>
  );
}
