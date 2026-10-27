export type Channel = "sms" | "email";

/** Dates are "YYYY-MM-DD" strings. Shape follows the brief's mock data. */
export type Client = {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  first_visit: string;
  last_visit: string;
  total_visits: number;
  total_spend_usd: number;
  services: string[];
  next_appointment?: string;
  birthday: string;
};

/**
 * Day filters are always relative to today, never fixed dates.
 * "lessThan 30 days ago" = fewer than 30 days have passed.
 * "moreThan 90 days ago" = more than 90 days have passed.
 * Exactly N days matches neither.
 */
type DayOp = "lessThan" | "moreThan";

export type Filter =
  | { id: string; field: "lastVisit"; op: DayOp; days: number }
  | { id: string; field: "firstVisit"; op: DayOp; days: number }
  /** days = days from now. Clients with no appointment never match lessThan/moreThan. */
  | { id: string; field: "nextAppointment"; op: DayOp; days: number }
  | { id: string; field: "nextAppointment"; op: "none" }
  | { id: string; field: "totalVisits"; op: DayOp; count: number }
  | { id: string; field: "totalSpend"; op: DayOp; amount: number }
  /** includes = has booked any of these services. */
  | { id: string; field: "services"; op: "includes" | "excludes"; services: string[] }
  /** months are 1 to 12. */
  | { id: string; field: "birthday"; op: "in" | "notIn"; months: number[] }
  | { id: string; field: "channel"; op: "includes" | "excludes"; channels: Channel[] };

/** Preset and saved groups are both just named filter lists. */
export type Segment = {
  id: string;
  name: string;
  filters: Filter[];
};

export type Audience =
  | { type: "segment"; segmentId: string }
  | { type: "custom"; filters: Filter[] };

export type SmsMessage = { text: string };

export type EmailMessage = { subject: string; body: string };

export type SendTime = { mode: "now" } | { mode: "scheduled"; iso: string };

export type Campaign = {
  id: string;
  name: string;
  channels: Channel[];
  /** Both messages are kept even when a channel is unselected, so edits survive. */
  messages: { sms?: SmsMessage; email?: EmailMessage };
  audience: Audience | null;
  sendTime: SendTime | null;
};
