import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../api/client";
import TxnRow from "../components/TxnRow";
import { Button, EmptyState, PageHeader, SelectInput, TextInput } from "../components/ui";
import { accountTitle, maskAccount, TYPE_LABELS } from "../lib/format";

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({ accountId: "", type: "ALL", from: "", to: "", q: "" });
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/accounts").then((response) => setAccounts(response.data));
  }, []);

  const load = (nextPage = page) => {
    const params = { page: nextPage, size: 8 };
    if (filters.accountId) params.accountId = filters.accountId;
    if (filters.type !== "ALL") params.type = filters.type;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.q.trim()) params.q = filters.q.trim();
    api.get("/transactions", { params }).then((response) => {
      setResult(response.data);
      setPage(response.data.page);
    });
  };

  useEffect(() => { load(0); }, []);

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Search every credit and debit on your accounts." />
      <form
        className="card mb-4 grid gap-3 p-4 md:grid-cols-5"
        onSubmit={(event) => { event.preventDefault(); load(0); }}
      >
        <SelectInput value={filters.accountId} onChange={(event) => setFilters({ ...filters, accountId: event.target.value })}>
          <option value="">All accounts</option>
          {accounts.map((item) => <option key={item.id} value={item.id}>{accountTitle(item)} {maskAccount(item.accountNumber)}</option>)}
        </SelectInput>
        <SelectInput value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="ALL">All types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </SelectInput>
        <TextInput type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <TextInput type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        <div className="flex gap-2">
          <TextInput value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search" />
          <Button type="submit" className="px-3" aria-label="Search"><Search size={16} /></Button>
        </div>
      </form>
      <div className="card px-5 py-2">
        {!result ? (
          <p className="py-10 text-center text-sm text-muted">Loading transactions…</p>
        ) : result.content.length === 0 ? (
          <EmptyState icon={<Search size={20} />} title="Nothing matches" text="Try a wider date range, or clear the search." />
        ) : result.content.map((txn) => <TxnRow key={txn.id} txn={txn} showBalance />)}
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
