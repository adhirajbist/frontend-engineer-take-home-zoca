import { Mail, MessageSquare, type LucideIcon } from "lucide-react";
import { AgentBubble } from "@/components/AgentBubble";
import { ReachCount } from "@/components/ReachCount";
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
      {/* Stacked on most screens, the group centred above the bubble.
          Short landscape screens go side by side. */}
      <div className="flex flex-1 flex-col gap-[clamp(1rem,4svh,2rem)] @xl:short:grid @xl:short:grid-cols-2 @xl:short:items-start @xl:short:gap-5">
        <div className="flex flex-1 flex-col justify-center-safe">
          <p className="text-[clamp(1.75rem,min(9vw,7svh),3.5rem)] font-extrabold leading-tight text-plum wrap-break-word short:text-2xl">
            {audienceName}
          </p>
          <div className="mt-[clamp(0.5rem,2svh,1rem)] flex flex-wrap gap-x-6 gap-y-1 short:mt-1">
            {counts.map(({ channel, count }) => (
              <ReachCount key={channel} {...REACH[channel]} count={count} />
            ))}
          </div>
        </div>
        {note && <Note note={note} onEdit={onEdit} />}
      </div>
    </StackCard>
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
