import type { ReactNode, Ref } from "react";

type RadioPillProps = {
  /** Shared by every pill in the group, so arrow keys move between them. */
  name: string;
  checked: boolean;
  onChange: () => void;
  /** Also runs when the pill is already selected, e.g. to reopen a picker. */
  onClick?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  /** Size and shape, e.g. "min-h-11 rounded-full". */
  className?: string;
  children: ReactNode;
};

/**
 * A native radio styled as a pill. Must sit in an element with
 * role="radiogroup". The radio itself is hidden, so the pill shows its focus.
 * The ring sticks out 6px: at the top of a card body, give the group pt-1.5.
 */
export function RadioPill({
  name,
  checked,
  onChange,
  onClick,
  inputRef,
  className = "",
  children,
}: RadioPillProps) {
  const colours = checked
    ? "border-burgundy bg-burgundy text-cream"
    : "border-ink/20 bg-white text-ink hover:border-burgundy";
  return (
    <label
      className={`flex cursor-pointer items-center justify-center gap-2 border-2 px-3 text-center font-bold has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-purple motion-safe:transition-colors ${colours} ${className}`}
    >
      <input
        ref={inputRef}
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        onClick={onClick}
        className="sr-only"
      />
      {children}
    </label>
  );
}
