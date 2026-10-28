import { formatCount } from "@/lib/format";

type PaginationProps = {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

/** aria-disabled (not disabled) so focus stays on the button at the first or last page. */
function PageButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={() => !disabled && onClick()}
      className="min-h-11 rounded-lg border border-ink/20 bg-white px-4 font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function Pagination({ page, pageCount, pageSize, total, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Client pages"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-ink/70">
        Showing {formatCount(from)} to {formatCount(to)} of {formatCount(total)}
      </p>
      <div className="flex items-center gap-3">
        <PageButton label="Previous" disabled={page === 1} onClick={() => onPageChange(page - 1)} />
        <p className="tabular-nums">
          Page {page} of {pageCount}
        </p>
        <PageButton label="Next" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} />
      </div>
    </nav>
  );
}
