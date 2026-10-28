import { StatusMessage } from "@/components/StatusMessage";
import { PRIMARY_BUTTON } from "@/components/custom-group/buttonStyles";

type EditorFooterProps = {
  /** One entry per failing field; each id is what that field's aria-describedby points to. */
  errors: { id: string; text: string }[];
  onSave: () => void;
};

/**
 * Save right under the fields, errors below it. The message area always keeps
 * room for two lines, so nothing moves when errors show or clear.
 */
export function EditorFooter({ errors, onSave }: EditorFooterProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <button type="button" onClick={onSave} className={`${PRIMARY_BUTTON} self-end`}>
        Save
      </button>
      <div role="alert" className="min-h-14">
        {errors.length > 0 && (
          <StatusMessage
            kind="error"
            text={errors.map((error) => (
              <span key={error.id} id={error.id} className="block">
                {error.text}
              </span>
            ))}
          />
        )}
      </div>
    </div>
  );
}
