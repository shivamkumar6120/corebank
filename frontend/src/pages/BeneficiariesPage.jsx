import { useEffect, useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import api, { errorMessage, fieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Alert, Button, EmptyState, Field, Modal, PageHeader, TextInput } from "../components/ui";
import { initials, maskAccount } from "../lib/format";

const blank = { name: "", nickname: "", accountNumber: "", bankName: "", ifsc: "" };

export default function BeneficiariesPage() {
  const notify = useToast();
  const [people, setPeople] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = () => api.get("/beneficiaries").then((response) => setPeople(response.data));
  useEffect(() => { load(); }, []);

  const start = (person) => {
    setEditing(person);
    setForm(person ? { name: person.name, nickname: person.nickname || "", accountNumber: person.accountNumber, bankName: person.bankName, ifsc: person.ifsc } : blank);
    setErrors({});
    setError("");
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editing) await api.put(`/beneficiaries/${editing.id}`, form);
      else await api.post("/beneficiaries", form);
      setOpen(false);
      notify(editing ? "Beneficiary updated" : "Beneficiary added");
      load();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    await api.delete(`/beneficiaries/${removing.id}`);
    setRemoving(null);
    notify("Beneficiary removed");
    load();
  };

  return (
    <div>
      <PageHeader title="Beneficiaries" subtitle="People and billers you pay often." action={<Button onClick={() => start(null)}>Add beneficiary</Button>} />
      {!people ? null : people.length === 0 ? (
        <div className="card"><EmptyState icon={<Users size={22} />} title="No beneficiaries yet" text="Save someone once, and the next transfer is only a PIN away." action={<Button onClick={() => start(null)}>Add beneficiary</Button>} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {people.map((person) => (
            <article key={person.id} className="card flex items-start gap-4 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 font-semibold text-brand-700">{initials(person.name)}</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{person.nickname || person.name}</h2>
                <p className="text-sm text-muted">{person.name} · {person.bankName}</p>
                <p className="mt-1 text-sm">{maskAccount(person.accountNumber)} · {person.ifsc}</p>
              </div>
              <div className="flex gap-1">
                <button className="rounded-lg p-2 text-muted hover:bg-slate-100" onClick={() => start(person)} aria-label="Edit"><Pencil size={16} /></button>
                <button className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600" onClick={() => setRemoving(person)} aria-label="Remove"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? "Edit beneficiary" : "Add beneficiary"} onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={save}>
          {error && <Alert>{error}</Alert>}
          <Field label="Name" error={errors.name}><TextInput required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Nickname" error={errors.nickname}><TextInput value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} /></Field>
          <Field label="Account number" error={errors.accountNumber}><TextInput required value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value.replace(/\D/g, "").slice(0, 18) })} /></Field>
          <Field label="Bank" error={errors.bankName}><TextInput required value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} /></Field>
          <Field label="IFSC" error={errors.ifsc}><TextInput required value={form.ifsc} onChange={(event) => setForm({ ...form, ifsc: event.target.value.toUpperCase() })} /></Field>
          <Button loading={loading} type="submit" className="w-full">Save</Button>
        </form>
      </Modal>

      <Modal open={Boolean(removing)} title="Remove beneficiary" onClose={() => setRemoving(null)}>
        <p className="text-sm text-muted">Remove {removing?.name}? This does not reverse any past transfers.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
