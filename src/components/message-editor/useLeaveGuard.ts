import { useEffect, useRef } from "react";

const GUARD_KEY = "lumenLeaveGuard";

function isGuardEntry(state: unknown): boolean {
  return typeof state === "object" && state !== null && GUARD_KEY in state;
}

/**
 * While `guarded`, warns before the tab is refreshed or closed (the browser's
 * own prompt), and catches the browser back button: an extra history entry
 * for the same page is added, so Back first lands on this page again and
 * `onBackAttempt` runs instead of leaving.
 */
export function useLeaveGuard(guarded: boolean, onBackAttempt: () => void) {
  const guardedRef = useRef(guarded);
  const onBackAttemptRef = useRef(onBackAttempt);
  useEffect(() => {
    guardedRef.current = guarded;
    onBackAttemptRef.current = onBackAttempt;
  });

  useEffect(() => {
    if (!guarded) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [guarded]);

  // Where the extra entry is, and whether the owner is on it now.
  const guardUrl = useRef<string | null>(null);
  const onGuardEntry = useRef(false);

  useEffect(() => {
    if (!guarded || onGuardEntry.current) return;
    // No URL: the address stays the same, and Next.js copies its own state in.
    window.history.pushState({ [GUARD_KEY]: true }, "");
    guardUrl.current = window.location.href;
    onGuardEntry.current = true;
  }, [guarded]);

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const leftGuard = onGuardEntry.current && window.location.href === guardUrl.current;
      onGuardEntry.current = isGuardEntry(event.state);
      if (!leftGuard) return;
      if (guardedRef.current) {
        window.history.pushState({ [GUARD_KEY]: true }, "");
        onGuardEntry.current = true;
        onBackAttemptRef.current();
      } else {
        // Clean again: carry on to the page the owner meant to go back to.
        window.history.back();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
