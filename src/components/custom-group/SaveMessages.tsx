import { StatusMessage } from "@/components/StatusMessage";
import type { SaveMessage } from "@/lib/saveFlow";

/**
 * Message under the Save as row. Takes no space when empty, so the table moves
 * down while a message shows. Both live regions stay in the page so screen
 * readers catch every new message.
 */
export function SaveMessages({ message }: { message: SaveMessage | null }) {
  return (
    <div className="sm:ml-auto sm:max-w-md">
      <div role="alert">
        {message?.kind === "error" && (
          <div className="mt-2">
            <StatusMessage {...message} />
          </div>
        )}
      </div>
      <div aria-live="polite">
        {message?.kind === "warning" && (
          <div className="mt-2">
            <StatusMessage {...message} />
          </div>
        )}
      </div>
    </div>
  );
}
