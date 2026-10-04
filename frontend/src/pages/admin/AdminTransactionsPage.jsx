import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import { Button, EmptyState, PageHeader, SelectInput, TextInput } from "../../components/ui";
import { formatDate, formatINR, TYPE_LABELS } from "../../lib/format";

const empty = { type: "ALL", from: "", to: "", minAmount: "", maxAmount: "" };

export default function AdminTransactionsPage() {
  const [filters, setFilters] = useState(empty);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const load = (nextPage = 0, nextFilters = filters) => {
    const params = { page: nextPage, size: 12 };
    if (nextFilters.type !== "ALL") params.type = nextFilters.type;
    if (nextFilters.from) params.from = nextFilters.from;
    if (nextFilters.to) params.to = nextFilters.to;
    if (nextFilters.minAmount) params.minAmount = nextFilters.minAmount;
    if (nextFilters.maxAmount) params.maxAmount = nextFilters.maxAmount;
    setError("");
    api.get("/admin/transactions", { params })
      .then((response) => setResult(response.data))
      .catch((err) => setError(errorMessage(err, "Transactions could not be loaded.")));
  };

  useEffect(() => { load(0, empty); }, []);

  const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div>
      <PageHeader title="Transaction log" subtitle="Search every movement in the bank. Nothing here can be edited." />
      <form
        className="card mb-4 grid gap-3 p-4 md:grid-cols-6"
        onSubmit={(event) => { event.preventDefault(); load(0); }}
      >
        <SelectInput value={filters.type} onChange={set("type")}>
          <option value="ALL">All types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </SelectInput>
        <TextInput type="date" value={filters.from} onChange={set("from")} aria-label="From date" />
        <TextInput type="date" value={filters.to} onChange={set("to")} aria-label="To date" />
        <TextInput inputMode="decimal" placeholder="Min amount" value={filters.minAmount} onChange={set("minAmount")} />
        <TextInput inputMode="decimal" placeholder="Max amount" value={filters.maxAmount} onChange={set("maxAmount")} />
        <Button type="submit" className="px-3"><Search size={16} /> Search</Button>
      </form>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      <div className="card overflow-x-auto">
        {!result ? (
          <p className="py-10 text-center text-sm text-muted">Loading transactions…</p>
        ) : result.content.length === 0 ? (
          <EmptyState icon={<Search size={20} />} title="Nothing matches" text="Try a wider date range or clear the amount filters." />
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
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
              {result.content.map((txn) => (
                <tr key={txn.id} className="border-t border-line">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {result && result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Page {result.page + 1} of {result.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={result.page === 0} onClick={() => load(result.page - 1)}>Previous</Button>
            <Button variant="secondary" disabled={result.page + 1 >= result.totalPages} onClick={() => load(result.page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
