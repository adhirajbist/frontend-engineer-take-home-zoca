import * as Tabs from "@radix-ui/react-tabs";
import type { Channel } from "@/types";

const TAB_LABELS: Record<Channel, string> = { sms: "Text", email: "Email" };

/**
 * Segmented switch between the text and email previews. Must sit inside
 * Tabs.Root. Right-aligned, also when it wraps under the title on phones.
 */
export function ChannelTabs({ channels }: { channels: readonly Channel[] }) {
  return (
    <Tabs.List
      aria-label="Which message to show"
      className="ml-auto grid shrink-0 auto-cols-fr grid-flow-col rounded-full bg-track p-0.5 sm:p-1"
    >
      {channels.map((channel) => (
        <Tabs.Trigger
          key={channel}
          value={channel}
          className="min-h-11 min-w-16 rounded-full px-3 text-sm text-muted sm:min-w-20 sm:px-4 sm:text-base data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink data-[state=active]:shadow-sm data-[state=active]:shadow-ink/15"
        >
          {TAB_LABELS[channel]}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
