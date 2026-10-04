import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy } from "lucide-react";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import TxnRow from "../components/TxnRow";
import { Badge, PageHeader, Skeleton } from "../components/ui";
import { accountTitle, formatDate, formatINR, maskAccount } from "../lib/format";

export default function AccountsPage() {
  const notify = useToast();
  const [accounts, setAccounts] = useState(null);
  const [selected, setSelected] = useState(null);
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    api.get("/accounts").then((response) => {
      setAccounts(response.data);
      setSelected(response.data[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get("/statements/mini", { params: { accountId: selected } }).then((response) => setTxns(response.data));
  }, [selected]);

  if (!accounts) return <Skeleton className="h-64 w-full" />;
  const account = accounts.find((item) => item.id === selected);

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(value);
    notify(`${label} copied`);
  };

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Savings and current accounts issued by CoreBank." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {accounts.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`card w-full p-4 text-left transition ${item.id === selected ? "border-brand-500 ring-4 ring-brand-500/10" : "hover:border-brand-100"}`}
            >
              <p className="text-sm font-medium">{accountTitle(item)}</p>
              <p className="money mt-2 text-xl font-semibold">{formatINR(item.balance)}</p>
              <p className="mt-1 text-xs text-muted">{maskAccount(item.accountNumber)}</p>
            </button>
          ))}
        </div>
        {account && (
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone="success">{account.status === "ACTIVE" ? "Active" : account.status}</Badge>
                  <h2 className="mt-3 text-xl font-semibold">{accountTitle(account)}</h2>
                  <p className="money mt-1 text-3xl font-semibold">{formatINR(account.balance)}</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/transfer" className="inline-flex h-10 items-center rounded-xl bg-navy-900 px-3 text-sm font-semibold text-white">Transfer</Link>
                  <Link to="/deposit" className="inline-flex h-10 items-center rounded-xl border border-line px-3 text-sm font-semibold">Deposit</Link>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Detail label="Account number" value={account.accountNumber} onCopy={() => copy(account.accountNumber, "Account number")} />
                <Detail label="IFSC" value={account.ifsc} onCopy={() => copy(account.ifsc, "IFSC")} />
                <Detail label="Branch" value={account.branch} />
                <Detail label="Opened" value={formatDate(account.createdAt)} />
              </dl>
            </div>
            <div className="card px-5 py-2">
              <div className="flex items-center justify-between py-3">
                <h3 className="font-semibold">Latest movements</h3>
                <Link to="/statements" className="text-sm font-semibold text-brand-600">Full statement</Link>
              </div>
              {txns.length === 0 ? <p className="py-8 text-center text-sm text-muted">No transactions on this account yet.</p> : txns.map((txn) => <TxnRow key={txn.id} txn={txn} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, onCopy }) {
  return (
    <div className="rounded-xl bg-ice px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{value}</p>
        {onCopy && (
          <button onClick={onCopy} className="text-muted hover:text-ink" aria-label={`Copy ${label}`}>
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
