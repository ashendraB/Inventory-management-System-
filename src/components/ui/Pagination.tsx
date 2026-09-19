import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-1 pt-2">
      <Link
        href={makeHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className="rounded-md border border-white/10 px-2.5 py-1.5 text-sm text-slate-300 hover:bg-white/10 aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Prev
      </Link>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="px-1 text-slate-400">…</span>
          )}
          <Link
            href={makeHref(p)}
            className={
              p === page
                ? "rounded-md bg-gold-500 px-3 py-1.5 text-sm font-medium text-brand-900"
                : "rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
            }
          >
            {p}
          </Link>
        </span>
      ))}
      <Link
        href={makeHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className="rounded-md border border-white/10 px-2.5 py-1.5 text-sm text-slate-300 hover:bg-white/10 aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Next
      </Link>
    </nav>
  );
}
