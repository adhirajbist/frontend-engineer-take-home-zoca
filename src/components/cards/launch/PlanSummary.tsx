import * as Dialog from "@radix-ui/react-dialog";
import { CircleAlert, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { renderMessage } from "@/lib/renderMessage";
import { formatSendTime } from "@/lib/time";
import type { Campaign, Channel } from "@/types";
import { SAMPLE_FIRST_NAME } from "../content/dummyContent";
import { MessagePreviewDialog, type MessagePreview } from "../content/MessagePreviewDialog";
import { jumpToCard } from "./jumpToCard";
import { SummaryScroll } from "./SummaryScroll";

type PlanSummaryProps = {
  campaign: Pick<Campaign, "name" | "channels" | "messages" | "sendTime">;
  groupName: string;
  /** Null until the browser knows today's date. */
  counts: Record<Channel, number> | null;
};

const CHANNEL_LABELS: Record<string, string> = {
  sms: "Text",
  email: "Email",
  "sms,email": "Text and email",
};

const SEE_LABELS: Record<Channel, string> = { sms: "See text", email: "See email" };
const REACH_PHRASES: Record<Channel, string> = { sms: "will be texted", email: "will be emailed" };

/** One row per earlier card, each with a shortcut back to it. */
export function PlanSummary({ campaign, groupName, counts }: PlanSummaryProps) {
  const { channels } = campaign;
  return (
    <SummaryScroll label="Campaign summary">
      <dl className="text-[clamp(0.9375rem,min(4vw,2.4svh),1.125rem)] leading-snug">
        <Row label="Campaign" editLabel="Edit campaign name" step={1}>
          <span className="font-bold wrap-anywhere">{campaign.name}</span>
        </Row>
        <Row label="Channel" editLabel="Edit channel" step={2}>
          {CHANNEL_LABELS[channels.join()]}
        </Row>
        <Row label="Content" editLabel="Edit messages" step={3}>
          <span className="flex flex-wrap gap-2 pt-1">
            {channels.map((channel) => (
              <SeeMessage key={channel} label={SEE_LABELS[channel]} preview={previewOf(campaign, channel)} />
            ))}
          </span>
        </Row>
        <Row label="Group" editLabel="Edit group" step={4}>
          <span className="block wrap-anywhere">{groupName}</span>
          {counts && (
            <span className="mt-0.5 flex flex-wrap gap-x-1.5 text-[0.875em]">
              {channels.map((channel, index) => (
                <ReachCount
                  key={channel}
                  count={counts[channel]}
                  phrase={REACH_PHRASES[channel]}
                  last={index === channels.length - 1}
                />
              ))}
            </span>
          )}
        </Row>
        <Row label="Send time" editLabel="Edit send time" step={5}>
          {formatSendTime(campaign.sendTime ?? { mode: "now" })}
        </Row>
      </dl>
    </SummaryScroll>
  );
}

function previewOf(campaign: PlanSummaryProps["campaign"], channel: Channel): MessagePreview {
  if (channel === "sms") {
    return { channel, text: renderMessage(campaign.messages.sms?.text ?? "", SAMPLE_FIRST_NAME) };
  }
  return {
    channel,
    subject: renderMessage(campaign.messages.email?.subject ?? "", SAMPLE_FIRST_NAME),
    body: renderMessage(campaign.messages.email?.body ?? "", SAMPLE_FIRST_NAME),
  };
}

type RowProps = {
  label: string;
  editLabel: string;
  step: number;
  children: ReactNode;
};

function Row({ label, editLabel, step, children }: RowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-ink/10 py-[clamp(0.25rem,1.2svh,0.625rem)] last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="col-start-1">{children}</dd>
      <dd className="col-start-2 row-span-2 row-start-1 self-center">
        <button
          type="button"
          aria-label={editLabel}
          onClick={() => jumpToCard(step)}
          className="flex size-11 items-center justify-center rounded-full text-plum hover:bg-ink/5"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </button>
      </dd>
    </div>
  );
}

function SeeMessage({ label, preview }: { label: string; preview: MessagePreview }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="min-h-11 rounded-full border-2 border-ink/20 bg-white px-4 text-[0.875em] font-bold text-ink hover:border-burgundy">
        {label}
      </Dialog.Trigger>
      <MessagePreviewDialog preview={preview} />
    </Dialog.Root>
  );
}

type ReachCountProps = { count: number; phrase: string; last: boolean };

function ReachCount({ count, phrase, last }: ReachCountProps) {
  return (
    <span className="inline-flex items-center gap-1">
      {count === 0 && (
        <CircleAlert role="img" aria-label="Nobody can be reached" className="size-4 shrink-0 text-error" />
      )}
      <span className="tabular-nums">
        {formatCount(count)} {phrase}
        {last ? "" : ","}
      </span>
    </span>
  );
}
