import { useEffect, useState } from "react";
import { formatCount } from "@/lib/format";

type ClientCountsProps = {
  total: number;
  texted: number;
  mailed: number;
};

/** Screen readers hear the counts once typing settles, not on every keystroke. */
const ANNOUNCE_DELAY_MS = 750;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function clients(n: number) {
  return n === 1 ? "Client" : "Clients";
}

export function ClientCounts({ total, texted, mailed }: ClientCountsProps) {
  const lines = [
    { n: total, rest: "Profiles" },
    { n: texted, rest: "will be texted" },
    { n: mailed, rest: "will be mailed" },
  ];
  const summary = lines.map(({ n, rest }) => `${formatCount(n)} ${clients(n)} ${rest}`).join(". ");
  const announced = useDebouncedValue(summary, ANNOUNCE_DELAY_MS);

  return (
    <>
      <ul className="mt-2 space-y-0.5 text-sm">
        {lines.map(({ n, rest }) => (
          <li key={rest}>
            <strong className="font-semibold tabular-nums">{formatCount(n)}</strong>{" "}
            <span className="text-ink/70">
              {rest}
            </span>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </>
  );
}
