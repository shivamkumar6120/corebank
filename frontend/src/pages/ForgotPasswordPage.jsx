import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import OtpInput from "../components/OtpInput";
import { Alert, Button, Field, TextInput } from "../components/ui";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setDemoOtp(data.demoOtp || "");
      setStep(2);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async (event) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword: password });
      setStep(4);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 4 ? "Password updated" : "Reset password"}
      subtitle={step === 4 ? "You can sign in with the new password." : "We'll confirm it's you with a one-time code, then you can choose a new password."}
    >
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {step === 1 && (
        <form className="space-y-4" onSubmit={requestCode}>
          <Field label="Email">
            <TextInput type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" />
          </Field>
          <Button className="w-full" loading={loading} type="submit">Send code</Button>
        </form>
      )}
      {step === 2 && (
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (otp.length === 6) setStep(3); else setError("Enter the 6-digit code"); }}>
          {demoOtp && <Alert tone="info">Demo code <span className="font-semibold tracking-[0.2em]">{demoOtp}</span></Alert>}
          <OtpInput value={otp} onChange={setOtp} />
          <Button className="w-full" type="submit">Continue</Button>
        </form>
      )}
      {step === 3 && (
        <form className="space-y-4" onSubmit={reset}>
          <Field label="New password" hint="8+ characters, with upper, lower, and a number.">
            <TextInput type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Confirm password">
            <TextInput type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          <Button className="w-full" loading={loading} type="submit">Update password</Button>
        </form>
      )}
      {step === 4 && (
        <Link to="/login" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white">Back to sign in</Link>
      )}
      {step !== 4 && (
        <p className="mt-6 text-sm text-muted">
          <Link to="/login" className="font-semibold text-ink">Back to sign in</Link>
        </p>
      )}
    </AuthLayout>
  );
}
