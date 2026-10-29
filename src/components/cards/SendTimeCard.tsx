"use client";

import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AgentBubble, NoteLines } from "@/components/AgentBubble";
import { NoCampaign } from "@/components/NoCampaign";
import { RadioPill } from "@/components/RadioPill";
import { StackCard } from "@/components/StackCard";
import { formatSendTime } from "@/lib/time";
import { useAgentNotesStore, useCardNote } from "@/store/agentNotesStore";
import { useCampaignStore } from "@/store/campaignStore";
import { SchedulePickerDialog } from "./send-time/SchedulePickerDialog";

const TITLE = "When we plan to send the messages";

/** Same size in every state: one line, full width, fixed height. */
const PILL =
  "h-14 w-full whitespace-nowrap rounded-2xl text-[clamp(0.9375rem,4.2cqi,1.125rem)] tabular-nums short:h-11 short:text-base";

export function SendTimeCard() {
  const { sendTime, setSendTime } = useCampaignStore(
    useShallow((state) => ({
      sendTime: state.campaign?.sendTime,
      setSendTime: state.setSendTime,
    })),
  );
  const note = useCardNote("time");
  // With the reason, even once it is dismissed: the bubble keeps its room.
  const fullNote = useAgentNotesStore((state) => state.notes?.time ?? null);
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
      {/* Centred in the space above the bubble. py-1.5 keeps focus rings inside the body. */}
      <div className="flex flex-1 flex-col justify-center-safe">
        <div
          role="radiogroup"
          aria-labelledby="step-5-title"
          className="flex flex-col gap-3 py-1.5 short:gap-2"
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
      </div>
      {/* Keeps the room of the reason, so the pills above never move when it goes. */}
      {note && (
        <AgentBubble
          atCardBottom
          className="pt-4 short:pt-2"
          reserveFor={fullNote && <NoteLines note={fullNote} />}
        >
          <NoteLines note={note} />
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

/** "Nov 03, 2026 @ 10:00 AM", on one line. */
function ScheduledLabel({ iso }: { iso: string }) {
  return (
    <span>
      <span className="sr-only">Later, </span>
      {formatSendTime({ mode: "scheduled", iso })}
    </span>
  );
}
