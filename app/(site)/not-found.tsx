import Link from "next/link";
import { EmptyState } from "@/components/ui/bits";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <EmptyState title="404 · Lost in the dream" action={<Link href="/" className="btn btn-neon">Back home</Link>}>
        This page doesn&apos;t exist. The pug looked everywhere.
      </EmptyState>
    </div>
  );
}
