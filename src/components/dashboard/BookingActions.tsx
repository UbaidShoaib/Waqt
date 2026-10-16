"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const neutralBtn =
  "rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";
const destructiveBtn =
  "rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60";

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
          <span className="text-xs text-slate-600">Cancel this booking?</span>
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
            className="text-xs text-slate-500 hover:text-slate-700"
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
          <span className="text-xs text-slate-600">
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
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Never mind
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingErase(true)}
          className="text-xs text-slate-500 underline hover:text-red-700"
        >
          Delete customer data
        </button>
      )}

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
