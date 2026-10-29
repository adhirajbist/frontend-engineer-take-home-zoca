"use client";

import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AgentBubble } from "@/components/AgentBubble";
import { NoCampaign } from "@/components/NoCampaign";
import { RadioPill } from "@/components/RadioPill";
import { StackCard } from "@/components/StackCard";
import { formatSendTime } from "@/lib/time";
import { useCardNote } from "@/store/agentNotesStore";
import { useCampaignStore } from "@/store/campaignStore";
import { SchedulePickerDialog } from "./send-time/SchedulePickerDialog";

const TITLE = "When we plan to send the messages";

/** Same size in every state: two lines tall, half the row wide. */
const PILL = "h-16 rounded-2xl text-base leading-tight tabular-nums";

export function SendTimeCard() {
  const { sendTime, setSendTime } = useCampaignStore(
    useShallow((state) => ({
      sendTime: state.campaign?.sendTime,
      setSendTime: state.setSendTime,
    })),
  );
  const note = useCardNote("time");
  const [pickerOpen, setPickerOpen] = useState(false);
  const laterRef = useRef<HTMLInputElement>(null);

  if (sendTime === undefined) {
    return (
      <StackCard step={5} title={TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }

  const scheduledIso = sendTime?.mode === "scheduled" ? sendTime.iso : null;
  const openPicker = () => setPickerOpen(true);

  return (
    <StackCard step={5} title={TITLE}>
      <div
        role="radiogroup"
        aria-labelledby="step-5-title"
        className="grid max-w-md grid-cols-2 gap-3 pt-1.5"
      >
        <RadioPill
          name="send-time"
          checked={sendTime?.mode === "now"}
          onChange={() => setSendTime({ mode: "now" })}
          className={PILL}
        >
          Now
        </RadioPill>
        {/* Nothing changes until the owner picks a time. Clicking it again
            while scheduled reopens the picker. */}
        <RadioPill
          name="send-time"
          checked={scheduledIso !== null}
          onChange={openPicker}
          onClick={scheduledIso ? openPicker : undefined}
          inputRef={laterRef}
          className={PILL}
        >
          {scheduledIso ? <ScheduledLabel iso={scheduledIso} /> : "Later"}
        </RadioPill>
      </div>
      {/* At the bottom, so the pills above never move when the reason goes. */}
      {note && (
        <AgentBubble atCardBottom className="pt-4 short:pt-2">
          {note.reason && <p className="mb-2 short:mb-1">{note.reason}</p>}
          <p>{note.neutral}</p>
        </AgentBubble>
      )}
      <SchedulePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        scheduledIso={scheduledIso}
        onDone={(iso) => {
          setSendTime({ mode: "scheduled", iso });
          setPickerOpen(false);
        }}
        returnFocusRef={laterRef}
      />
    </StackCard>
  );
}

/** "Nov 03, 2026" and "@ 10:00 AM", wrapping only between the two. */
function ScheduledLabel({ iso }: { iso: string }) {
  const [date, time] = formatSendTime({ mode: "scheduled", iso }).split(" @ ");
  return (
    <span>
      <span className="sr-only">Later, </span>
      <span className="whitespace-nowrap">{date}</span>{" "}
      <span className="whitespace-nowrap">@ {time}</span>
    </span>
  );
}
