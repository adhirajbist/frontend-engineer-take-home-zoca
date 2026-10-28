import { useState } from "react";

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
};

/**
 * Whole numbers from 0 up. While the box is empty the last valid value stays
 * in effect, and leaving the box puts that value back.
 */
export function NumberInput({ value, onChange, label, className = "w-20" }: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function handleChange(text: string) {
    if (!/^\d*$/.test(text)) return;
    setDraft(text);
    const number = Number(text);
    if (text !== "" && Number.isSafeInteger(number)) onChange(number);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      maxLength={7}
      aria-label={label}
      value={draft ?? String(value)}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => setDraft(null)}
      className={`h-11 shrink-0 rounded-lg border border-ink/20 bg-white px-3 text-sm ${className}`}
    />
  );
}
