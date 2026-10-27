import Image from "next/image";
import { Mail, MessageSquare, type LucideIcon } from "lucide-react";
import { StackCard } from "@/components/StackCard";

type AudienceCardProps = {
  audienceName: string;
  textCount: number;
  emailCount: number;
  reason: string;
  onEdit?: () => void;
};

/** DUMMY DATA: placeholder values until the card is wired to real state. */
export const DUMMY_AUDIENCE = {
  audienceName: "Lapsed 90+ days",
  textCount: 212,
  emailCount: 168,
  reason:
    "I picked these clients because it’s been over 3 months since their last visit, and a friendly nudge often brings them back.",
} satisfies Omit<AudienceCardProps, "onEdit">;

export function AudienceCard({
  audienceName,
  textCount,
  emailCount,
  reason,
  onEdit,
}: AudienceCardProps) {
  return (
    <StackCard step={4} title="Here’s who we’ll reach out to">
      {/* Stacked on most screens. Short landscape screens go side by side. */}
      <div className="flex flex-col gap-[clamp(1rem,4svh,2rem)] sm:short:grid sm:short:grid-cols-2 sm:short:items-start sm:short:gap-5">
        <div>
          <p className="text-[clamp(1.75rem,min(9vw,7svh),3.5rem)] font-extrabold leading-tight text-plum short:text-2xl">
            {audienceName}
          </p>
          <div className="mt-[clamp(0.5rem,2svh,1rem)] flex flex-wrap gap-x-6 gap-y-1 short:mt-1">
            <Reach icon={MessageSquare} count={textCount} phrase="by text" />
            <Reach icon={Mail} count={emailCount} phrase="by email" />
          </div>
        </div>
        <AgentBubble reason={reason} onEdit={onEdit} />
      </div>
    </StackCard>
  );
}

type ReachProps = {
  icon: LucideIcon;
  count: number;
  phrase: string;
};

function Reach({ icon: Icon, count, phrase }: ReachProps) {
  const number = count.toLocaleString("en-US");
  return (
    <p className="flex items-center gap-2 text-[clamp(1rem,min(4.5vw,3svh),1.375rem)] short:text-base">
      {/* Screen readers get one clean phrase, e.g. "212 by text". */}
      <span className="sr-only">
        {number} {phrase}
      </span>
      <Icon aria-hidden="true" className="size-[1.4em] shrink-0 text-plum" />
      <span aria-hidden="true">
        <span className="text-[1.75em] font-extrabold leading-none">{number}</span>{" "}
        {phrase}
      </span>
    </p>
  );
}

type AgentBubbleProps = {
  reason: string;
  onEdit?: () => void;
};

function AgentBubble({ reason, onEdit }: AgentBubbleProps) {
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
        <p>{reason}</p>
        <p className="mt-2 short:mt-1">
          Want to change who gets this?{" "}
          <button
            type="button"
            onClick={onEdit}
            className="mt-1 inline-block rounded-full bg-yellow px-3 py-1.5 font-bold text-ink short:mt-0.5 short:py-0.5"
          >
            Edit clients
          </button>
        </p>
      </div>
    </div>
  );
}
