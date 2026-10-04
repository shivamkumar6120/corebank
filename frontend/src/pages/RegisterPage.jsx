import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage, fieldErrors } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, Field, PinField, TextInput } from "../components/ui";

const empty = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
  transactionPin: "",
  confirmPin: "",
  dateOfBirth: "",
  address: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const next = {};
    if (form.password !== form.confirm) next.confirm = "Passwords do not match";
    if (form.transactionPin !== form.confirmPin) next.confirmPin = "PINs do not match";
    if (!/^\d{4}$/.test(form.transactionPin)) next.transactionPin = "PIN must be 4 digits";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        transactionPin: form.transactionPin,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address || null,
      });
      navigate("/verify", { state: { email: data.email, purpose: "REGISTER", demoOtp: data.demoOtp, message: data.message } });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Open your account" subtitle="A savings account and a current account are created after you confirm the one-time code.">
      <form className="space-y-4" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field label="Full name" error={errors.fullName}>
          <TextInput required value={form.fullName} onChange={set("fullName")} placeholder="Aarav Mehta" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email}>
            <TextInput type="email" required value={form.email} onChange={set("email")} placeholder="you@email.com" />
          </Field>
          <Field label="Mobile" error={errors.phone}>
            <TextInput required inputMode="numeric" maxLength={10} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="9876543210" />
          </Field>
        </div>
        <Field label="Date of birth" hint="Optional. You need to be 18 or older." error={errors.dateOfBirth}>
          <TextInput type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        </Field>
        <Field label="Address" error={errors.address}>
          <TextInput value={form.address} onChange={set("address")} placeholder="City, street" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password} hint="8+ characters, with upper, lower, and a number.">
            <TextInput type="password" required value={form.password} onChange={set("password")} />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <TextInput type="password" required value={form.confirm} onChange={set("confirm")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transaction PIN" error={errors.transactionPin}>
            <PinField value={form.transactionPin} onChange={(value) => setForm((current) => ({ ...current, transactionPin: value }))} />
          </Field>
          <Field label="Confirm PIN" error={errors.confirmPin}>
            <PinField value={form.confirmPin} onChange={(value) => setForm((current) => ({ ...current, confirmPin: value }))} />
          </Field>
        </div>
        <Button className="w-full" loading={loading} type="submit">Create account</Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already with us? <Link to="/login" className="font-semibold text-ink">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
