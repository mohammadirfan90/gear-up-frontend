export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  paid: "Paid",
  picked_up: "Picked up",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TONE: Record<string, string> = {
  placed: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  confirmed: "bg-blue-500/10 text-blue-300 border-blue-400/30",
  paid: "bg-purple-500/10 text-purple-300 border-purple-400/30",
  picked_up: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
  returned: "bg-zinc-500/10 text-zinc-300 border-zinc-400/30",
  cancelled: "bg-rose-500/10 text-rose-300 border-rose-400/30",
};

// Keys must match the backend PaymentStatus enum values
// (pending | completed | failed | refunded). `succeeded` is kept as an alias
// because Stripe's own intent status uses that spelling.
export const PAYMENT_STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  completed: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
  succeeded: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
  failed: "bg-rose-500/10 text-rose-300 border-rose-400/30",
  refunded: "bg-zinc-500/10 text-zinc-300 border-zinc-400/30",
};
