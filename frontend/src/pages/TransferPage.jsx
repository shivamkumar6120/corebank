import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import ReceiptView, { receiptRows } from "../components/ReceiptView";
import { Alert, AmountField, Button, Field, PageHeader, PinField, SelectInput, TextInput } from "../components/ui";
import { accountTitle, formatINR, maskAccount } from "../lib/format";

const blank = {
  fromAccountId: "",
  toAccountId: "",
  beneficiaryId: "",
  accountName: "",
  accountNumber: "",
  bankName: "",
  ifsc: "",
  saveBeneficiary: false,
  amount: "",
  pin: "",
  remarks: "",
  newPayee: false,
};

export default function TransferPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("own");
  const [step, setStep] = useState("form");
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/accounts"), api.get("/beneficiaries")]).then(([accountRes, peopleRes]) => {
      setAccounts(accountRes.data);
      setBeneficiaries(peopleRes.data);
      setForm((current) => ({
        ...current,
        fromAccountId: String(accountRes.data[0]?.id || ""),
        toAccountId: String(accountRes.data[1]?.id || accountRes.data[0]?.id || ""),
        beneficiaryId: peopleRes.data[0] ? String(peopleRes.data[0].id) : "",
        newPayee: peopleRes.data.length === 0,
      }));
    });
  }, []);

  const from = accounts.find((item) => String(item.id) === form.fromAccountId);
  const to = accounts.find((item) => String(item.id) === form.toAccountId);
  const beneficiary = beneficiaries.find((item) => String(item.id) === form.beneficiaryId);
  const payeeName = mode === "own"
    ? (to ? accountTitle(to) : "Own account")
    : form.newPayee ? (form.accountName || "New payee") : (beneficiary?.nickname || beneficiary?.name || "Beneficiary");

  const summary = useMemo(() => ([
    ["From", from ? `${accountTitle(from)} ${maskAccount(from.accountNumber)}` : "—"],
    ["To", payeeName],
    ["Amount", form.amount ? formatINR(form.amount) : "—"],
    ["Fee", "₹0.00"],
  ]), [from, payeeName, form.amount]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const review = (event) => {
    event.preventDefault();
    setError("");
    if (!form.amount || Number(form.amount) < 1) return setError("Enter an amount of at least ₹1");
    if (form.pin.length !== 4) return setError("Enter your 4-digit transaction PIN");
    if (mode === "own" && form.fromAccountId === form.toAccountId) return setError("Choose two different accounts");
    if (mode === "other" && form.newPayee && (!form.accountName || !form.accountNumber || !form.bankName || !form.ifsc)) {
      return setError("Enter the recipient account details");
    }
    setStep("review");
  };

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = mode === "own"
        ? {
            fromAccountId: Number(form.fromAccountId),
            toAccountId: Number(form.toAccountId),
            amount: Number(form.amount),
            pin: form.pin,
            remarks: form.remarks,
          }
        : {
            fromAccountId: Number(form.fromAccountId),
            beneficiaryId: form.newPayee ? null : Number(form.beneficiaryId),
            accountName: form.accountName,
            accountNumber: form.accountNumber,
            bankName: form.bankName,
            ifsc: form.ifsc,
            saveBeneficiary: form.saveBeneficiary,
            amount: Number(form.amount),
            pin: form.pin,
            remarks: form.remarks,
          };
      const { data } = await api.post(mode === "own" ? "/transfers/own" : "/transfers/other", payload);
      setReceipt(data);
      setStep("done");
    } catch (err) {
      setError(errorMessage(err));
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done" && receipt) {
    return <ReceiptView title={receipt.title} subtitle="The transfer is complete." amount={receipt.amount} rows={receiptRows(receipt)} onDone={() => navigate("/")} />;
  }

  return (
    <div>
      <PageHeader title="Transfer money" subtitle="Move funds between your accounts, or send them to someone else." />
      <div className="mb-5 inline-flex rounded-xl bg-white p-1 shadow-card">
        {[["own", "Own account"], ["other", "Other account"]].map(([id, label]) => (
          <button key={id} onClick={() => { setMode(id); setStep("form"); setError(""); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === id ? "bg-navy-900 text-white" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <form className="card space-y-4 p-6" onSubmit={step === "form" ? review : (event) => event.preventDefault()}>
          {error && <Alert>{error}</Alert>}
          <Field label="From account">
            <SelectInput value={form.fromAccountId} onChange={(event) => set("fromAccountId", event.target.value)}>
              {accounts.map((item) => <option key={item.id} value={item.id}>{accountTitle(item)} · {maskAccount(item.accountNumber)} · {formatINR(item.balance)}</option>)}
            </SelectInput>
          </Field>
          {mode === "own" ? (
            <Field label="To account">
              <SelectInput value={form.toAccountId} onChange={(event) => set("toAccountId", event.target.value)}>
                {accounts.map((item) => <option key={item.id} value={item.id}>{accountTitle(item)} · {maskAccount(item.accountNumber)}</option>)}
              </SelectInput>
            </Field>
          ) : (
            <>
              <Field label="Beneficiary">
                <SelectInput
                  value={form.newPayee ? "new" : form.beneficiaryId}
                  onChange={(event) => {
                    if (event.target.value === "new") setForm((current) => ({ ...current, newPayee: true }));
                    else setForm((current) => ({ ...current, newPayee: false, beneficiaryId: event.target.value }));
                  }}
                >
                  {beneficiaries.map((item) => <option key={item.id} value={item.id}>{item.nickname || item.name} · {item.bankName}</option>)}
                  <option value="new">New payee</option>
                </SelectInput>
              </Field>
              {form.newPayee && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Account name"><TextInput value={form.accountName} onChange={(event) => set("accountName", event.target.value)} /></Field>
                  <Field label="Account number"><TextInput value={form.accountNumber} onChange={(event) => set("accountNumber", event.target.value.replace(/\D/g, "").slice(0, 18))} /></Field>
                  <Field label="Bank"><TextInput value={form.bankName} onChange={(event) => set("bankName", event.target.value)} /></Field>
                  <Field label="IFSC"><TextInput value={form.ifsc} onChange={(event) => set("ifsc", event.target.value.toUpperCase())} /></Field>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" checked={form.saveBeneficiary} onChange={(event) => set("saveBeneficiary", event.target.checked)} />
                    Save this beneficiary
                  </label>
                </div>
              )}
            </>
          )}
          <Field label="Amount"><AmountField value={form.amount} onChange={(value) => set("amount", value)} /></Field>
          <Field label="Note"><TextInput value={form.remarks} maxLength={120} onChange={(event) => set("remarks", event.target.value)} placeholder="Optional" /></Field>
          <Field label="Transaction PIN"><PinField value={form.pin} onChange={(value) => set("pin", value)} /></Field>
          {step === "form" ? (
            <Button type="submit">Review transfer</Button>
          ) : (
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep("form")}>Back</Button>
              <Button type="button" loading={loading} onClick={confirm}>Confirm transfer</Button>
            </div>
          )}
        </form>
        <aside className="card p-6 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Summary</p>
          <dl className="mt-4 space-y-3 text-sm">
            {summary.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted">CoreBank transfers inside the demo are instant and free. External accounts are recorded as a simulated NEFT.</p>
        </aside>
      </div>
    </div>
  );
}
