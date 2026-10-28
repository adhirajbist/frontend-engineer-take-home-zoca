import Image from "next/image";
import type { ReactNode } from "react";

/** Steve's avatar with a speech bubble. Shared so every agent message looks the same. */
export function AgentBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 short:gap-2">
      <Image
        src="/steve-profile-icon.png"
        alt="Steve"
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover short:size-8"
      />
      <div className="relative min-w-0 rounded-2xl bg-aubergine px-4 py-3 text-[clamp(0.875rem,min(4vw,2.6svh),1.125rem)] leading-snug text-cream short:px-3 short:py-2 short:text-xs">
        {/* Tail pointing at the avatar. */}
        <span
          aria-hidden="true"
          className="absolute top-4 -left-1.5 size-3 rotate-45 bg-aubergine short:top-2.5"
        />
        {children}
      </div>
    </div>
  );
}
