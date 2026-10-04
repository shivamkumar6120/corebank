import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { formatDate, formatINR, maskAccount } from "../lib/format";
import { Button } from "./ui";

export default function ReceiptView({ title, subtitle, amount, rows, onDone, secondary }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="card px-6 py-8 sm:px-8">
        <div className="check-pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <Check size={30} strokeWidth={2.4} />
        </div>
        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>}
        <p className="money mt-3 text-center text-4xl font-semibold tracking-tight">{formatINR(amount)}</p>
        <dl className="mt-8 divide-y divide-line text-sm">
          {rows.filter((row) => row.value).map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-6 py-3">
              <dt className="text-muted">{row.label}</dt>
              <dd className="text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={onDone}>Done</Button>
          {secondary || (
            <Link to="/transactions" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-line text-sm font-semibold hover:bg-slate-50">
              View activity
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function receiptRows(receipt) {
  return [
    { label: "Reference", value: receipt.referenceNumber },
    { label: "From", value: receipt.fromAccount ? maskAccount(receipt.fromAccount) : "" },
    { label: "To", value: receipt.toName },
    { label: "Account", value: receipt.toAccount && receipt.toAccount !== receipt.fromAccount ? receipt.toAccount : "" },
    { label: "Note", value: receipt.remarks },
    { label: "Balance after", value: formatINR(receipt.balanceAfter) },
    { label: "When", value: formatDate(receipt.createdAt) },
  ];
}
