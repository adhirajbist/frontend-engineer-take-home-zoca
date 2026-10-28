import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Channel, Client, Filter } from "@/types";

export function canText(client: Client): boolean {
  return client.sms_opt_in && Boolean(client.phone);
}

export function canEmail(client: Client): boolean {
  return client.email_opt_in && Boolean(client.email);
}

function canReach(client: Client, channel: Channel): boolean {
  return channel === "sms" ? canText(client) : canEmail(client);
}

/** Calendar days from date to today. Dates are "YYYY-MM-DD". */
function daysSince(date: string, today: Date): number {
  return differenceInCalendarDays(today, parseISO(date));
}

/** Strict: exactly n matches neither operator. */
function compare(op: "lessThan" | "moreThan", actual: number, n: number): boolean {
  return op === "lessThan" ? actual < n : actual > n;
}

/** Days until the next appointment, or null if none is booked from today on. */
function daysUntilAppointment(client: Client, today: Date): number | null {
  if (!client.next_appointment) return null;
  const days = -daysSince(client.next_appointment, today);
  return days < 0 ? null : days;
}

function birthMonth(client: Client): number {
  return Number(client.birthday.slice(5, 7));
}

export function matchesFilter(client: Client, filter: Filter, today: Date): boolean {
  switch (filter.field) {
    case "lastVisit":
      return compare(filter.op, daysSince(client.last_visit, today), filter.days);
    case "firstVisit":
      return compare(filter.op, daysSince(client.first_visit, today), filter.days);
    case "nextAppointment": {
      const days = daysUntilAppointment(client, today);
      if (filter.op === "none") return days === null;
      return days !== null && compare(filter.op, days, filter.days);
    }
    case "totalVisits":
      return compare(filter.op, client.total_visits, filter.count);
    case "totalSpend":
      return compare(filter.op, client.total_spend_usd, filter.amount);
    case "services": {
      const hasAny = filter.services.some((service) => client.services.includes(service));
      return filter.op === "includes" ? hasAny : !hasAny;
    }
    case "birthday": {
      const inList = filter.months.includes(birthMonth(client));
      return filter.op === "in" ? inList : !inList;
    }
    case "channel": {
      const reachable = filter.channels.some((channel) => canReach(client, channel));
      return filter.op === "includes" ? reachable : !reachable;
    }
  }
}

/** All filters must match. No filters means everyone. */
export function filterClients(clients: Client[], filters: Filter[], today: Date): Client[] {
  return clients.filter((client) =>
    filters.every((filter) => matchesFilter(client, filter, today)),
  );
}
