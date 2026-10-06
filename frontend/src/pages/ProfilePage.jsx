import { useState } from "react";
import api, { errorMessage, fieldErrors } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Alert, Button, Field, PageHeader, PinField, TextInput } from "../components/ui";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    dateOfBirth: user?.dateOfBirth || "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [pin, setPin] = useState({ password: "", currentPin: "", newPin: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.put("/profile", {
        ...profile,
        address: profile.address || null,
        dateOfBirth: profile.dateOfBirth || null,
      });
      setUser(data);
      notify("Profile updated");
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.put("/profile/password", password);
      setPassword({ currentPassword: "", newPassword: "" });
      notify("Password updated");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const savePin = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.put("/profile/pin", pin);
      setPin({ password: "", currentPin: "", newPin: "" });
      notify("Transaction PIN updated");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Profile" subtitle="Keep your contact details, password, and transaction PIN up to date." />
      {error && <Alert>{error}</Alert>}
      <form className="card space-y-4 p-6" onSubmit={saveProfile}>
        <h2 className="font-semibold">Personal details</h2>
        <Field label="Full name" error={errors.fullName}><TextInput required value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></Field>
        <Field label="Email" hint="Email is your sign-in ID and cannot be changed."><TextInput value={user?.email || ""} disabled /></Field>
        <Field label="Mobile" error={errors.phone}><TextInput required value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })} /></Field>
        <Field label="Date of birth"><TextInput type="date" value={profile.dateOfBirth || ""} onChange={(event) => setProfile({ ...profile, dateOfBirth: event.target.value })} /></Field>
        <Field label="Address"><TextInput value={profile.address || ""} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></Field>
        <Button type="submit">Save profile</Button>
      </form>
      <form className="card space-y-4 p-6" onSubmit={savePassword}>
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password"><TextInput type="password" required value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></Field>
        <Field label="New password"><TextInput type="password" required value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} /></Field>
        <Button type="submit" variant="secondary">Update password</Button>
      </form>
      <form className="card space-y-4 p-6" onSubmit={savePin}>
        <h2 className="font-semibold">Change transaction PIN</h2>
        <Field label="Account password"><TextInput type="password" required value={pin.password} onChange={(event) => setPin({ ...pin, password: event.target.value })} /></Field>
        <Field label="Current PIN"><PinField value={pin.currentPin} onChange={(value) => setPin({ ...pin, currentPin: value })} /></Field>
        <Field label="New PIN"><PinField value={pin.newPin} onChange={(value) => setPin({ ...pin, newPin: value })} /></Field>
        <Button type="submit" variant="navy">Update PIN</Button>
      </form>
    </div>
  );
}
