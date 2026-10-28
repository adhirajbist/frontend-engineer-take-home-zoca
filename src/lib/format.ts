/** 1234 -> "1,234". */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** "+15125550101" -> "(512) 555-0101". Other formats are shown as given. */
export function formatPhone(phone: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
}
