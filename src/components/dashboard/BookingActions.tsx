"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const neutralBtn =
  "min-h-9 rounded-pill border border-line bg-paper-raised px-3.5 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-60";
const destructiveBtn =
  "min-h-9 rounded-pill border border-danger/40 bg-paper-raised px-3.5 text-xs font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-60";

type Status = "confirmed" | "cancelled" | "completed" | "no_show";
type PaymentStatus = "unpaid" | "paid";
type Action = "cancel" | "complete" | "no_show" | "mark_paid" | "erase";

export default function BookingActions({
  bookingId,
  status,
  paymentStatus,
  customerId,
}: {
  bookingId: string;
  status: Status;
  paymentStatus: PaymentStatus;
  customerId: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, string>, action: Action) {
    setPendingAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Couldn't update — try again.");
        setPendingAction(null);
        return;
      }
      setConfirmingCancel(false);
      setPendingAction(null);
      router.refresh();
    } catch {
      setError("Couldn't update — try again.");
      setPendingAction(null);
    }
  }

  async function eraseCustomer() {
    setPendingAction("erase");
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Couldn't delete — try again.");
    } finally {
      setPendingAction(null);
      setConfirmingErase(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {confirmingCancel ? (
        <>
          <span className="text-xs text-ink-muted">Cancel this booking?</span>
          <button
            type="button"
            disabled={pendingAction === "cancel"}
            onClick={() => patch({ status: "cancelled" }, "cancel")}
            className={destructiveBtn}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmingCancel(false)}
            className="text-xs text-ink-muted hover:text-ink"
          >
            Never mind
          </button>
        </>
      ) : (
        status === "confirmed" && (
          <>
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className={destructiveBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pendingAction === "complete"}
              onClick={() => patch({ status: "completed" }, "complete")}
              className={neutralBtn}
            >
              Complete
            </button>
            <button
              type="button"
              disabled={pendingAction === "no_show"}
              onClick={() => patch({ status: "no_show" }, "no_show")}
              className={neutralBtn}
            >
              No-show
            </button>
          </>
        )
      )}

      {paymentStatus === "unpaid" && (
        <button
          type="button"
          disabled={pendingAction === "mark_paid"}
          onClick={() => patch({ payment_status: "paid" }, "mark_paid")}
          className={neutralBtn}
        >
          Mark paid
        </button>
      )}

      {confirmingErase ? (
        <>
          <span className="text-xs text-ink-muted">
            Permanently delete this customer and all their bookings?
          </span>
          <button
            type="button"
            disabled={pendingAction === "erase"}
            onClick={eraseCustomer}
            className={destructiveBtn}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmingErase(false)}
            className="text-xs text-ink-muted hover:text-ink"
          >
            Never mind
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingErase(true)}
          className="text-xs text-ink-muted underline hover:text-danger"
        >
          Delete customer data
        </button>
      )}

      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}
