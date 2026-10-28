import { Redo2, Undo2, type LucideIcon } from "lucide-react";

type UndoRedoButtonsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo }: UndoRedoButtonsProps) {
  return (
    <div className="flex gap-1">
      <IconButton label="Undo" Icon={Undo2} enabled={canUndo} onClick={onUndo} />
      <IconButton label="Redo" Icon={Redo2} enabled={canRedo} onClick={onRedo} />
    </div>
  );
}

type IconButtonProps = { label: string; Icon: LucideIcon; enabled: boolean; onClick: () => void };

/**
 * aria-disabled rather than disabled, so a keyboard user's focus stays on
 * the button when the last step is undone.
 */
function IconButton({ label, Icon, enabled, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={!enabled}
      // Keeps the editor focused (and the phone keyboard open) on mouse and touch.
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => enabled && onClick()}
      className="flex size-11 items-center justify-center rounded-lg text-burgundy hover:bg-ink/5 aria-disabled:cursor-not-allowed aria-disabled:text-ink/35 aria-disabled:hover:bg-transparent"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
