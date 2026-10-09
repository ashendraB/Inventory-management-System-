import Link from "next/link";

/** Reprint opens the Printing Calculator pre-filled from this job (details and
 * stored PDF), so printing it again is recorded, costed and billed like any
 * other job — see the `reprint` handling in the calculator page. */
export function ReprintButton({
  recordId,
  className = "text-gold-400 hover:underline",
}: {
  recordId: string;
  className?: string;
}) {
  return (
    <Link href={`/printing/calculator?reprint=${recordId}`} className={className}>
      Reprint
    </Link>
  );
}
