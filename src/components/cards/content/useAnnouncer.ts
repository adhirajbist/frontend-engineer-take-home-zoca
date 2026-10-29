import { useCallback, useState } from "react";

/**
 * Text for an aria-live region. Saying the same thing twice alternates a
 * trailing space so it is read again.
 */
export function useAnnouncer() {
  const [message, setMessage] = useState({ text: "", count: 0 });
  const announce = useCallback(
    (text: string) => setMessage((last) => ({ text, count: last.count + 1 })),
    [],
  );
  return { announcement: message.text + (message.count % 2 ? " " : ""), announce };
}
