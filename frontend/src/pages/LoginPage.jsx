import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, Field, TextInput } from "../components/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedOut] = useState(() => sessionStorage.getItem("corebank_signed_out") === "1");
  useEffect(() => {
    sessionStorage.removeItem("corebank_signed_out");
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      navigate("/verify", { state: { email: data.email, purpose: "LOGIN", demoOtp: data.demoOtp, message: data.message } });
    } catch (err) {
      setError(errorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in with your email. We'll ask for a one-time code before opening your accounts.">
      <form className="space-y-4" onSubmit={submit}>
        {signedOut && <Alert tone="success">You have been signed out.</Alert>}
        {error && <Alert>{error}</Alert>}
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <TextInput className="pr-16" type={show ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted" onClick={() => setShow((value) => !value)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
        </div>
        <Button className="w-full" loading={loading} type="submit">Continue</Button>
      </form>
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-dashed border-line px-4 py-3 text-left text-sm hover:bg-white"
        onClick={() => { setEmail("demo@corebank.app"); setPassword("Demo@1234"); }}
      >
        <span className="font-semibold text-ink">Use the demo profile</span>
        <span className="mt-0.5 block text-muted">demo@corebank.app · Demo@1234 · PIN 2580</span>
      </button>
      <p className="mt-6 text-sm text-muted">
        New to CoreBank? <Link to="/register" className="font-semibold text-ink">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
