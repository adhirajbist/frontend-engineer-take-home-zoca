import { Mail, MessageSquare, type LucideIcon } from "lucide-react";
import { AgentBubble } from "@/components/AgentBubble";
import { StackCard } from "@/components/StackCard";
import type { AgentNote, Channel } from "@/types";

/** One count per channel the campaign sends on. */
export type ChannelCount = { channel: Channel; count: number };

type AudienceCardProps = {
  audienceName: string;
  counts: readonly ChannelCount[];
  /** What Steve says. No bubble when null. */
  note: AgentNote | null;
  onEdit?: () => void;
};

export const AUDIENCE_TITLE = "Here’s who we’ll reach out to";

const REACH: Record<Channel, { icon: LucideIcon; phrase: string }> = {
  sms: { icon: MessageSquare, phrase: "by text" },
  email: { icon: Mail, phrase: "by email" },
};

export function AudienceCard({ audienceName, counts, note, onEdit }: AudienceCardProps) {
  return (
    <StackCard step={4} title={AUDIENCE_TITLE}>
      {/* Stacked on most screens. Short landscape screens go side by side. */}
      <div className="flex flex-1 flex-col gap-[clamp(1rem,4svh,2rem)] sm:short:grid sm:short:grid-cols-2 sm:short:items-start sm:short:gap-5">
        <div>
          <p className="text-[clamp(1.75rem,min(9vw,7svh),3.5rem)] font-extrabold leading-tight text-plum short:text-2xl">
            {audienceName}
          </p>
          <div className="mt-[clamp(0.5rem,2svh,1rem)] flex flex-wrap gap-x-6 gap-y-1 short:mt-1">
            {counts.map(({ channel, count }) => (
              <Reach key={channel} {...REACH[channel]} count={count} />
            ))}
          </div>
        </div>
        {note && <Note note={note} onEdit={onEdit} />}
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

type NoteProps = {
  note: AgentNote;
  onEdit?: () => void;
};

function Note({ note, onEdit }: NoteProps) {
  return (
    <AgentBubble atCardBottom>
      {note.reason && <p className="mb-2 short:mb-1">{note.reason}</p>}
      <p>
        {note.neutral}{" "}
        <button
          type="button"
          onClick={onEdit}
          className="mt-1 inline-block rounded-2xl bg-yellow px-3 py-1.5 font-bold text-ink short:mt-0.5 short:py-0.5"
        >
          Edit clients
        </button>
      </p>
    </AgentBubble>
  );
}
