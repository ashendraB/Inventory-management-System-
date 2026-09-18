"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Field";
import type { InvoiceStatus } from "@prisma/client";

const NEXT_LABEL: Partial<Record<InvoiceStatus, string>> = {
  DRAFT: "Mark Generated",
  GENERATED: "Mark Issued",
  ISSUED: "Mark Paid",
};
const NEXT_STATUS: Partial<Record<InvoiceStatus, InvoiceStatus>> = {
  DRAFT: "GENERATED",
  GENERATED: "ISSUED",
  ISSUED: "PAID",
};

export function InvoiceStatusActions({
  invoiceId,
  status,
  lecturerEmail,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  lecturerEmail: string | null;
}) {
  const router = useRouter();
  const [emailing, setEmailing] = useState(false);

  async function transition(target: InvoiceStatus) {
    const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not update this invoice.");
      return;
    }
    toast.success(`Invoice marked ${target.toLowerCase()}`);
    router.refresh();
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Cancel this invoice? Its printing jobs become billable again on a future run. This cannot be undone."
    );
    if (!confirmed) return;
    await transition("CANCELLED");
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Permanently delete this draft invoice? This cannot be undone."
    );
    if (!confirmed) return;
    const res = await fetch(`/api/billing/invoices/${invoiceId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? "Could not delete this invoice.");
      return;
    }
    toast.success("Invoice deleted");
    router.push("/billing/invoices");
    router.refresh();
  }

  async function handleEmail() {
    setEmailing(true);
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send the email.");
        return;
      }
      toast.success(`Invoice emailed to ${lecturerEmail}`);
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setEmailing(false);
    }
  }

  const nextStatus = NEXT_STATUS[status];

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        Print / Save as PDF
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={handleEmail}
        disabled={emailing || !lecturerEmail}
        title={lecturerEmail ? undefined : "This lecturer has no email address on file"}
      >
        {emailing ? "Sending..." : "Email Invoice"}
      </Button>
      {nextStatus && (
        <Button type="button" onClick={() => transition(nextStatus)}>
          {NEXT_LABEL[status]}
        </Button>
      )}
      {status !== "PAID" && status !== "CANCELLED" && (
        <Button type="button" variant="danger" onClick={handleCancel}>
          Cancel Invoice
        </Button>
      )}
      {status === "DRAFT" && (
        <Button type="button" variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      )}
    </div>
  );
}
