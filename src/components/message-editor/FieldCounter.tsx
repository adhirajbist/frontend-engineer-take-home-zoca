import { countCharacters, remainingCharacters, type MessageField } from "@/lib/messageLimits";

type FieldCounterProps = {
  id: string;
  field: MessageField;
  /** What the field is called for screen readers, e.g. "Text message". */
  name: string;
  value: string;
};

/** "121/135 characters", red with "· 4 too many" once over the limit. */
export function FieldCounter({ id, field, name, value }: FieldCounterProps) {
  const count = countCharacters(value);
  const remaining = remainingCharacters(field, value);
  const over = remaining < 0;

  return (
    <>
      <p id={id} className={`text-sm ${over ? "font-semibold text-error" : "text-muted"}`}>
        {count}/{count + remaining} characters
        {over && ` · ${-remaining} too many`}
      </p>
      {/* Changes only when crossing the limit, so it is not read on every keystroke. */}
      <p aria-live="polite" className="sr-only">
        {over ? `${name} is over the limit.` : `${name} is within the limit.`}
      </p>
    </>
  );
}
