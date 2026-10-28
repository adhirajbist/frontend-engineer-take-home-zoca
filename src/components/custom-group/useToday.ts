import { format, parseISO } from "date-fns";
import { useMemo, useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getTodayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Today's date in the visitor's time zone, or null while rendering on the
 * server. The server never reads the clock, so prerendering and hydration
 * always agree.
 */
export function useToday(): Date | null {
  const key = useSyncExternalStore(subscribe, getTodayKey, () => null);
  return useMemo(() => (key ? parseISO(key) : null), [key]);
}
