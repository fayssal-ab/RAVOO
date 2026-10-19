"use client";

import { EmptyState } from "@/components/ui/bits";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <EmptyState title="Something broke" action={<button type="button" onClick={reset} className="btn btn-neon">Try again</button>}>
        The page hit an error. Give it another go.
      </EmptyState>
    </div>
  );
}
