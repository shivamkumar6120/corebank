import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import ReceiptView, { receiptRows } from "../components/ReceiptView";
import { Alert, AmountField, Button, Field, PageHeader, PinField, SelectInput, TextInput } from "../components/ui";
import { accountTitle, formatINR, maskAccount } from "../lib/format";

const methods = [
  ["UPI", "UPI"],
  ["CASH", "Cash"],
  ["CHEQUE", "Cheque"],
];

export default function MoneyPage({ mode }) {
  const navigate = useNavigate();
  const deposit = mode === "deposit";
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [remarks, setRemarks] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.get("/accounts").then((response) => {
      setAccounts(response.data);
      setAccountId(String(response.data[0]?.id || ""));
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!amount || Number(amount) < 1) {
      setError("Enter an amount of at least ₹1");
      return;
    }
    if (!deposit && pin.length !== 4) {
      setError("Enter your 4-digit transaction PIN");
      return;
    }
    setLoading(true);
    try {
      const payload = deposit
        ? { accountId: Number(accountId), amount: Number(amount), method, remarks }
        : { accountId: Number(accountId), amount: Number(amount), pin, remarks };
      const { data } = await api.post(deposit ? "/accounts/deposit" : "/accounts/withdraw", payload);
      setReceipt(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <ReceiptView
        title={receipt.title}
        subtitle={deposit ? "The amount is available in your account." : "The cash withdrawal has been recorded."}
        amount={receipt.amount}
        rows={receiptRows(receipt)}
        onDone={() => navigate("/")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={deposit ? "Deposit money" : "Withdraw money"}
        subtitle={deposit ? "Simulate a cash, UPI, or cheque credit. Nothing leaves the demo." : "Take cash out of an account. Your transaction PIN is required."}
      />
      <form className="card space-y-4 p-6" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field label="Account">
          <SelectInput value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>{accountTitle(item)} · {maskAccount(item.accountNumber)} · {formatINR(item.balance)}</option>
            ))}
          </SelectInput>
        </Field>
        {deposit && (
          <Field label="Method">
            <div className="grid grid-cols-3 gap-2">
              {methods.map(([id, label]) => (
                <button type="button" key={id} onClick={() => setMethod(id)} className={`h-11 rounded-xl border text-sm font-semibold ${method === id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line"}`}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Amount"><AmountField value={amount} onChange={setAmount} /></Field>
        <Field label="Note"><TextInput value={remarks} maxLength={120} onChange={(event) => setRemarks(event.target.value)} placeholder="Optional" /></Field>
        {!deposit && <Field label="Transaction PIN"><PinField value={pin} onChange={setPin} /></Field>}
        <Button loading={loading} type="submit" className="w-full">{deposit ? "Add money" : "Withdraw"}</Button>
      </form>
    </div>
  );
}
