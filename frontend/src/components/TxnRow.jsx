import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn, formatDate, formatINR, TYPE_LABELS } from "../lib/format";

export default function TxnRow({ txn, hidden = false, showBalance = false }) {
  const credit = txn.direction === "CREDIT";
  return (
    <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", credit ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-navy-800")}>
        {credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txn.description}</p>
        <p className="truncate text-xs text-muted">
          {formatDate(txn.createdAt)} · {txn.category || TYPE_LABELS[txn.type] || "Payment"}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("money text-sm font-semibold", credit ? "text-emerald-600" : "text-ink")}>
          {credit ? "+" : "−"}
          {formatINR(txn.amount, hidden)}
        </p>
        {showBalance && <p className="money text-[11px] text-muted">Bal {formatINR(txn.balanceAfter, hidden)}</p>}
      </div>
    </div>
  );
}
