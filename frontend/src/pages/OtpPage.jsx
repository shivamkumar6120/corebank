import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import OtpInput from "../components/OtpInput";
import { Alert, Button } from "../components/ui";

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { establish } = useAuth();
  const state = location.state || {};
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState(state.demoOtp || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!state.email || !state.purpose) {
    return (
      <AuthLayout title="Verification" subtitle="Start from sign in or registration so we know which code to check.">
        <Link to="/login" className="text-sm font-semibold text-brand-600">Back to sign in</Link>
      </AuthLayout>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-otp", { email: state.email, otp, purpose: state.purpose });
      establish(data.token, data.user);
      navigate(data.user?.admin ? "/admin" : "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Incorrect verification code"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      const { data } = await api.post("/auth/resend-otp", { email: state.email, purpose: state.purpose });
      setDemoOtp(data.demoOtp || "");
      setOtp("");
      setCooldown(30);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthLayout title="Enter your code" subtitle={state.message || `We prepared a code for ${state.email}.`}>
      <form className="space-y-5" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        {demoOtp && (
          <Alert tone="info">
            Demo mode, no SMS gateway. Your code is <span className="font-semibold tracking-[0.2em]">{demoOtp}</span>
          </Alert>
        )}
        <OtpInput value={otp} onChange={setOtp} />
        <Button className="w-full" loading={loading} type="submit">Verify and continue</Button>
        <button type="button" disabled={cooldown > 0} className="w-full text-sm font-medium text-muted disabled:opacity-60" onClick={resend}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </form>
    </AuthLayout>
  );
}
