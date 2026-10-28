import { SegmentedTabs } from "@/components/SegmentedTabs";
import type { Channel } from "@/types";

const TAB_LABELS: Record<Channel, string> = { sms: "Text", email: "Email" };

/**
 * Segmented switch between the text and email previews. Must sit inside
 * Tabs.Root. Right-aligned, also when it wraps under the title on phones.
 */
export function ChannelTabs({ channels }: { channels: readonly Channel[] }) {
  return (
    <SegmentedTabs
      label="Which message to show"
      options={channels.map((channel) => ({ value: channel, label: TAB_LABELS[channel] }))}
      className="ml-auto"
    />
  );
}
