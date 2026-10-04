import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import ReceiptView, { receiptRows } from "../components/ReceiptView";
import { Alert, AmountField, Button, Field, PageHeader, PinField, SelectInput, TextInput } from "../components/ui";
import { accountTitle, formatINR, maskAccount } from "../lib/format";

export default function BillsPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [mode, setMode] = useState("bill");
  const [accountId, setAccountId] = useState("");
  const [billerCode, setBillerCode] = useState("");
  const [consumerNumber, setConsumerNumber] = useState("");
  const [operator, setOperator] = useState("Jio");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/bills/catalog"), api.get("/accounts")]).then(([catalogRes, accountRes]) => {
      setCatalog(catalogRes.data);
      setAccounts(accountRes.data);
      setAccountId(String(accountRes.data[0]?.id || ""));
      setBillerCode(catalogRes.data.billers[0]?.code || "");
      setOperator(catalogRes.data.operators[0] || "Jio");
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (pin.length !== 4) return setError("Enter your 4-digit transaction PIN");
    if (!amount || Number(amount) < 1) return setError("Enter an amount of at least ₹1");
    setLoading(true);
    try {
      const payload = mode === "bill"
        ? { accountId: Number(accountId), billerCode, consumerNumber, amount: Number(amount), pin }
        : { accountId: Number(accountId), operator, mobile, amount: Number(amount), pin };
      const { data } = await api.post(mode === "bill" ? "/bills/pay" : "/bills/recharge", payload);
      setReceipt(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return <ReceiptView title={receipt.title} subtitle="The payment has been recorded on your account." amount={receipt.amount} rows={receiptRows(receipt)} onDone={() => navigate("/")} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Bills & recharge" subtitle="Pay a utility bill or top up a mobile number. Both are simulated inside CoreBank." />
      <div className="mb-5 inline-flex rounded-xl bg-white p-1 shadow-card">
        {[["bill", "Bill payment"], ["recharge", "Mobile recharge"]].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === id ? "bg-navy-900 text-white" : "text-muted"}`}>{label}</button>
        ))}
      </div>
      <form className="card space-y-4 p-6" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field label="Pay from">
          <SelectInput value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.map((item) => <option key={item.id} value={item.id}>{accountTitle(item)} · {maskAccount(item.accountNumber)} · {formatINR(item.balance)}</option>)}
          </SelectInput>
        </Field>
        {mode === "bill" ? (
          <>
            <div className="grid gap-2 sm:grid-cols-5">
              {(catalog?.billers || []).map((biller) => (
                <button type="button" key={biller.code} onClick={() => setBillerCode(biller.code)} className={`rounded-2xl border px-2 py-3 text-center ${billerCode === biller.code ? "border-brand-500 bg-brand-50" : "border-line"}`}>
                  <span className="block text-[11px] uppercase tracking-wide text-muted">{biller.category}</span>
                  <span className="mt-1 block text-sm font-semibold">{biller.name}</span>
                </button>
              ))}
            </div>
            <Field label="Consumer number">
              <TextInput required value={consumerNumber} onChange={(event) => setConsumerNumber(event.target.value)} placeholder="Account or consumer ID" />
            </Field>
          </>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {(catalog?.operators || []).map((item) => (
                <button type="button" key={item} onClick={() => setOperator(item)} className={`h-11 rounded-xl border text-sm font-semibold ${operator === item ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line"}`}>{item}</button>
              ))}
            </div>
            <Field label="Mobile number">
              <TextInput required inputMode="numeric" maxLength={10} value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
            </Field>
            <div className="flex flex-wrap gap-2">
              {(catalog?.rechargePlans || []).map((plan) => (
                <button type="button" key={plan} onClick={() => setAmount(String(plan))} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${amount === String(plan) ? "border-navy-900 bg-navy-900 text-white" : "border-line"}`}>
                  ₹{plan}
                </button>
              ))}
            </div>
          </>
        )}
        <Field label="Amount"><AmountField value={amount} onChange={setAmount} /></Field>
        <Field label="Transaction PIN"><PinField value={pin} onChange={setPin} /></Field>
        <Button loading={loading} type="submit" className="w-full">{mode === "bill" ? "Pay bill" : "Recharge"}</Button>
      </form>
    </div>
  );
}
