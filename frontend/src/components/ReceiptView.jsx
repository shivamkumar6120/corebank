import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDate, formatINR, maskAccount } from "../lib/format";
import { EASE, useMotionSafe } from "../lib/motion";
import { Button } from "./ui";

export default function ReceiptView({ title, subtitle, amount, rows, onDone, secondary }) {
  const reduce = useMotionSafe();
  return (
    <motion.div
      className="mx-auto max-w-lg"
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
    >
      <div className="card px-6 py-8 sm:px-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <motion.path
              d="M7 16.5 13 22.5 25 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
            />
          </svg>
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
    </motion.div>
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
