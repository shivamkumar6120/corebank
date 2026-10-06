import { useEffect, useState } from "react";
import { Landmark, Receipt, Users } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import MotionRow from "../../components/MotionRow";
import { EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { formatDate, formatINR, TYPE_LABELS } from "../../lib/format";

const cards = [
  { key: "totalUsers", label: "Registered users", icon: Users },
  { key: "totalAccounts", label: "Accounts", icon: Landmark },
  { key: "transactionVolume", label: "Transaction volume", icon: Receipt, money: true },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/stats")
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err, "The admin dashboard could not be loaded.")));
  }, []);

  if (error) return <EmptyState title="Dashboard unavailable" text={error} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="A read-only view of customers, accounts, and recent activity." />
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article key={card.key} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{card.label}</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <card.icon size={18} />
              </span>
            </div>
            <p className="money mt-4 text-2xl font-semibold tracking-tight">
              {card.money ? formatINR(data[card.key]) : data[card.key]}
            </p>
          </article>
        ))}
      </section>
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Latest transactions</h2>
          <p className="text-sm text-muted">The 10 most recent movements across every account.</p>
        </div>
        {data.recent.length === 0 ? (
          <EmptyState title="No transactions yet" text="Activity will show up here after customers move money." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Account</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((txn, index) => (
                  <MotionRow key={txn.id} index={index} className="border-t border-line">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(txn.createdAt)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{txn.customerName}</p>
                      <p className="text-xs text-muted">{txn.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{txn.accountNumber}</td>
                    <td className="px-5 py-3">{TYPE_LABELS[txn.type] || txn.type}</td>
                    <td className="max-w-[220px] truncate px-5 py-3">{txn.description}</td>
                    <td className={`money px-5 py-3 text-right font-semibold ${txn.direction === "CREDIT" ? "text-emerald-600" : "text-ink"}`}>
                      {txn.direction === "CREDIT" ? "+" : "−"}{formatINR(txn.amount)}
                    </td>
                  </MotionRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
