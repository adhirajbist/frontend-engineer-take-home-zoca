import type { LucideIcon } from "lucide-react";
import { formatCount } from "@/lib/format";

type ReachCountProps = {
  icon: LucideIcon;
  count: number;
  /** The rest of the sentence, e.g. "by text". */
  phrase: string;
};

/** A big number with an icon and a smaller phrase after it, e.g. "212 by text". */
export function ReachCount({ icon: Icon, count, phrase }: ReachCountProps) {
  const number = formatCount(count);
  return (
    <p className="flex items-center gap-2 text-[clamp(1rem,min(4.5vw,3svh),1.375rem)] short:text-base">
      {/* Screen readers get one clean phrase, e.g. "212 by text". */}
      <span className="sr-only">
        {number} {phrase}
      </span>
      <Icon aria-hidden="true" className="size-[1.4em] shrink-0 text-plum" />
      <span aria-hidden="true">
        <span className="text-[1.75em] font-extrabold leading-none tabular-nums">{number}</span>{" "}
        {phrase}
      </span>
    </p>
  );
}
