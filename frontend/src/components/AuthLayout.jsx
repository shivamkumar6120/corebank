import Logo from "./Logo";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="auth-panel relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="auth-grid pointer-events-none absolute inset-0" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">CoreBank</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">Banking, with a calmer surface.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            A complete internet-banking desk for accounts, transfers, bills, and statements. Built as a focused academic project.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />Savings and current accounts from day one</li>
            <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />Transfers guarded by a transaction PIN</li>
            <li className="flex gap-3"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />Statements you can download as PDF</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">Demonstration only. No real payment gateway is connected.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-[1.7rem] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm leading-6 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
