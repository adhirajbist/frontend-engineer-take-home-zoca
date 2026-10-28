import * as Tooltip from "@radix-ui/react-tooltip";
import { CircleCheck, CircleX } from "lucide-react";
import { useState } from "react";
import type { Channel } from "@/types";

type ContactCellProps = {
  channel: Channel;
  value?: string;
  optedIn: boolean;
};

const TEXT = {
  email: { missing: "No email on file", yes: "Subscribed to email", no: "Declined email" },
  sms: { missing: "No phone number on file", yes: "Subscribed to SMS", no: "Declined SMS" },
} satisfies Record<Channel, Record<string, string>>;

/** Email or phone plus an opt-in icon. With no value, only a dash. */
export function ContactCell({ channel, value, optedIn }: ContactCellProps) {
  const text = TEXT[channel];
  if (!value) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{text.missing}</span>
      </>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      <span className="truncate">{value}</span>
      <StatusIcon optedIn={optedIn} label={optedIn ? text.yes : text.no} />
    </div>
  );
}

type StatusIconProps = { optedIn: boolean; label: string };

/** Tooltip opens on hover, keyboard focus and tap (Radix alone skips tap). */
function StatusIcon({ optedIn, label }: StatusIconProps) {
  const [open, setOpen] = useState(false);
  const Icon = optedIn ? CircleCheck : CircleX;

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger
        aria-label={label}
        onClick={(event) => {
          // Stops Radix closing the tooltip on click, so a tap opens it.
          event.preventDefault();
          setOpen(true);
        }}
        // The icon is small; the ::before box gives it a 44px tap area. It
        // reaches left over the text, not right, so it never overflows the table.
        className={`relative inline-flex size-4 shrink-0 items-center justify-center rounded-full before:absolute before:-inset-y-3.5 before:-right-1 before:-left-6 ${optedIn ? "text-success" : "text-danger"}`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          collisionPadding={16}
          className="z-10 rounded-md bg-ink px-2 py-1 text-xs text-cream"
        >
          {label}
          <Tooltip.Arrow className="fill-ink" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
