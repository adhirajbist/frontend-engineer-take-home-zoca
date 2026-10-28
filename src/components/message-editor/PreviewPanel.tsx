import { EmailPreview } from "@/components/cards/content/EmailPreview";
import { SmsBubble } from "@/components/cards/content/SmsBubble";
import { SAMPLE_FIRST_NAME } from "@/components/cards/content/dummyContent";
import { PREVIEW_BOX } from "@/components/cards/content/previewBox";
import type { FieldValues } from "@/lib/messageEditorReducer";
import { renderMessage } from "@/lib/renderMessage";
import type { Channel } from "@/types";

type PreviewPanelProps = {
  channel: Channel;
  /** The last values within their limits. */
  preview: FieldValues;
  /** True while any field is over its limit. */
  paused: boolean;
};

/** The message as a client sees it, with the sample name filled in. */
export function PreviewPanel({ channel, preview, paused }: PreviewPanelProps) {
  const show = (text: string | undefined) => renderMessage(text ?? "", SAMPLE_FIRST_NAME);

  return (
    <>
      <div className={PREVIEW_BOX}>
        {channel === "sms" ? (
          <SmsBubble text={show(preview.sms)} />
        ) : (
          <EmailPreview subject={show(preview.emailSubject)} body={show(preview.emailBody)} />
        )}
      </div>
      {paused && (
        <p className="mt-2 text-sm text-muted">Preview paused until your message fits.</p>
      )}
    </>
  );
}
