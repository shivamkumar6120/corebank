import { cn } from "../lib/format";

export function Button({ children, variant = "primary", loading = false, className, ...props }) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-line bg-white text-ink hover:bg-slate-50",
    ghost: "text-muted hover:bg-slate-100 hover:text-ink",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    navy: "bg-navy-900 text-white hover:bg-navy-800",
  };
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 ease-out motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-lift motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none",
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="error-text">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props) {
  return <input className={cn("field", props.className)} {...props} />;
}

export function SelectInput(props) {
  return <select className={cn("field bg-white", props.className)} {...props} />;
}

export function TextArea(props) {
  return <textarea className={cn("field h-24 py-3", props.className)} {...props} />;
}

export function Alert({ tone = "error", children }) {
  const tones = {
    error: "border-rose-100 bg-rose-50 text-rose-700",
    info: "border-brand-100 bg-brand-50 text-brand-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
  return <div className={cn("rounded-xl border px-3.5 py-3 text-sm", tones[tone])}>{children}</div>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-brand-50 text-brand-700",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", tones[tone])}>{children}</span>;
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/80", className)} />;
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lift">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-slate-100" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PinField({ value, onChange, placeholder = "••••" }) {
  return (
    <input
      className="field text-center text-base font-semibold tracking-[0.45em]"
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      type="password"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
    />
  );
}

export function AmountField({ value, onChange }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">₹</span>
      <input
        className="field money pl-8 text-base font-semibold"
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.]/g, "");
          if (/^\d*\.?\d{0,2}$/.test(next)) onChange(next);
        }}
      />
    </div>
  );
}

export function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-ice">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl bg-brand-600" />
        <p className="mt-4 text-sm font-medium text-muted">Opening CoreBank</p>
      </div>
    </div>
  );
}
