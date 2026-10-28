import { CircleAlert, TriangleAlert } from "lucide-react";
import type { SaveMessage } from "@/lib/saveFlow";

const STYLES = {
  error: { icon: CircleAlert, label: "Error:", className: "bg-error-bg text-error" },
  warning: { icon: TriangleAlert, label: "Heads up:", className: "bg-warning-bg text-warning" },
};

type StatusMessageProps = SaveMessage & { id?: string };

/** Soft error or warning box. The icon and hidden label mean it never relies on colour. */
export function StatusMessage({ kind, text, id }: StatusMessageProps) {
  const { icon: Icon, label, className } = STYLES[kind];
  return (
    <p id={id} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="sr-only">{label} </span>
        {text}
      </span>
    </p>
  );
}
