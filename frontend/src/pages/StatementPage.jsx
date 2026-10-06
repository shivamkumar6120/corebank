import { useEffect, useState } from "react";
import api, { errorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import TxnRow from "../components/TxnRow";
import { Button, PageHeader, SelectInput, TextInput } from "../components/ui";
import { accountTitle, formatINR, isoDate, maskAccount } from "../lib/format";

export default function StatementPage() {
  const notify = useToast();
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [tab, setTab] = useState("mini");
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [mini, setMini] = useState([]);
  const [statement, setStatement] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get("/accounts").then((response) => {
      setAccounts(response.data);
      setAccountId(String(response.data[0]?.id || ""));
    });
  }, []);

  useEffect(() => {
    if (!accountId) return;
    api.get("/statements/mini", { params: { accountId } }).then((response) => setMini(response.data));
  }, [accountId]);

  const viewPeriod = async (event) => {
    event?.preventDefault();
    const { data } = await api.get("/statements", { params: { accountId, from, to } });
    setStatement(data);
    setTab("period");
  };

  const download = async () => {
    setDownloading(true);
    try {
      const response = await api.get("/statements/pdf", { params: { accountId, from, to }, responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CoreBank-Statement-${accountId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      let message = "Could not download the statement";
      if (err.response?.data instanceof Blob) {
        try {
          message = JSON.parse(await err.response.data.text()).message || message;
        } catch {
          /* keep fallback */
        }
      } else {
        message = errorMessage(err, message);
      }
      notify(message, "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Statements" subtitle="A mini statement for a quick look, or a dated statement you can download." />
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-[220px] flex-1">
          <span className="label">Account</span>
          <SelectInput value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.map((item) => <option key={item.id} value={item.id}>{accountTitle(item)} {maskAccount(item.accountNumber)}</option>)}
          </SelectInput>
        </label>
        <label>
          <span className="label">From</span>
          <TextInput type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          <span className="label">To</span>
          <TextInput type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <Button variant="secondary" onClick={viewPeriod}>View period</Button>
        <Button loading={downloading} onClick={download}>Download PDF</Button>
      </div>
      <div className="mb-4 inline-flex rounded-xl bg-white p-1 shadow-card">
        {[["mini", "Mini statement"], ["period", "Selected period"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? "bg-navy-900 text-white" : "text-muted"}`}>{label}</button>
        ))}
      </div>
      {tab === "mini" ? (
        <div className="card px-5 py-2">
          <p className="py-3 text-sm text-muted">Latest 10 transactions.</p>
          {mini.length === 0 ? <p className="py-8 text-center text-sm text-muted">No transactions yet.</p> : mini.map((txn) => <TxnRow key={txn.id} txn={txn} showBalance />)}
        </div>
      ) : statement ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Opening", statement.openingBalance],
              ["Money in", statement.totalCredit],
              ["Money out", statement.totalDebit],
              ["Closing", statement.closingBalance],
            ].map(([label, value]) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="money mt-1 text-lg font-semibold">{formatINR(value)}</p>
              </div>
            ))}
          </div>
          <div className="card px-5 py-2">
            {statement.transactions.length === 0 ? <p className="py-8 text-center text-sm text-muted">No transactions in this period.</p> : statement.transactions.map((txn) => <TxnRow key={txn.id} txn={txn} showBalance />)}
          </div>
        </div>
      ) : (
        <div className="card px-6 py-12 text-center text-sm text-muted">Choose dates and view the period to see opening and closing balances.</div>
      )}
    </div>
  );
}
