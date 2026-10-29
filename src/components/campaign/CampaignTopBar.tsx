"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * The way back to the landing page. Client-side, so the campaign in memory
 * survives and "Continue" there brings the owner back. Nothing is lost, so
 * no confirmation. Its height is --app-header-h (see globals.css).
 */
export function CampaignTopBar() {
  const router = useRouter();

  return (
    <header className="h-(--app-header-h) shrink-0 border-b border-ink/15 bg-cream px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-10">
      {/* Same width as the card stack, so Back lines up with the cards. */}
      <div className="mx-auto flex h-full max-w-2xl items-center">
        {/* Inset focus outline: the bar is barely taller than the button, so an
            outside one would be clipped at the top of the screen. Important,
            because the global :focus-visible rule is unlayered. */}
        <button
          type="button"
          aria-label="Back to Steve"
          onClick={() => router.push("/")}
          className="-ml-2 inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-2 font-semibold text-burgundy hover:bg-ink/5 focus-visible:-outline-offset-3!"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back
        </button>
      </div>
    </header>
  );
}
