import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Eye, EyeOff, Receipt, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import api from "../api/client";
import TxnRow from "../components/TxnRow";
import { EmptyState, Skeleton } from "../components/ui";
import { accountTitle, formatINR, greeting, maskAccount } from "../lib/format";

const actions = [
  { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { to: "/deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/bills", label: "Pay bills", icon: Receipt },
  { to: "/statements", label: "Statement", icon: FileText },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem("corebank_hide_balance") === "1");

  useEffect(() => {
    api.get("/dashboard")
      .then((response) => {
        setData(response.data);
        setSelected(response.data.accounts?.[0]?.id ?? null);
      })
      .catch(() => setError("We couldn't load your dashboard."));
  }, []);

  const toggle = () => {
    setHidden((value) => {
      localStorage.setItem("corebank_hide_balance", value ? "0" : "1");
      return !value;
    });
  };

  if (error) return <EmptyState title="Dashboard unavailable" text={error} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const account = data.accounts.find((item) => item.id === selected) || data.accounts[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting(data.fullName)}</h1>
        <p className="mt-1 text-sm text-muted">Here is a clear view of your money today.</p>
      </div>

      <section className="hero-card relative overflow-hidden rounded-3xl p-6 text-white md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100">Available balance</p>
            <p className="money mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{formatINR(account?.balance, hidden)}</p>
            <p className="mt-2 text-sm text-blue-100">
              {accountTitle(account)} {account ? maskAccount(account.accountNumber) : ""} · Total {formatINR(data.totalBalance, hidden)}
            </p>
          </div>
          <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/15" aria-label="Toggle balance">
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {data.accounts.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.id === account?.id ? "bg-white text-navy-900" : "bg-white/10 text-white"}`}
            >
              {accountTitle(item)}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="group flex flex-col items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-white text-navy-800 shadow-card transition group-hover:-translate-y-0.5 group-hover:border-brand-500/30">
              <action.icon size={18} />
            </span>
            <span className="text-xs font-medium text-muted">{action.label}</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Last 7 days</h2>
              <p className="text-xs text-muted">Money in and money out, across your accounts</p>
            </div>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-400" /> In</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-navy-800" /> Out</span>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart} barGap={3}>
                <CartesianGrid vertical={false} stroke="#E4E9F2" />
                <XAxis dataKey="label" tick={{ fill: "#5C6B82", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(47,107,255,0.06)" }}
                  formatter={(value, name) => [formatINR(value), name === "moneyIn" ? "In" : "Out"]}
                />
                <Bar dataKey="moneyIn" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="moneyOut" fill="#102444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid gap-4 lg:col-span-2">
          <div className="card p-5">
            <p className="text-sm text-muted">Money in this month</p>
            <p className="money mt-2 text-2xl font-semibold text-emerald-600">{formatINR(data.moneyInThisMonth, hidden)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-muted">Money out this month</p>
            <p className="money mt-2 text-2xl font-semibold">{formatINR(data.moneyOutThisMonth, hidden)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-muted">Unread alerts</p>
            <p className="mt-2 text-2xl font-semibold">{data.unreadNotifications}</p>
            <Link to="/notifications" className="mt-2 inline-block text-sm font-semibold text-brand-600">Open inbox</Link>
          </div>
        </div>
      </section>

      <section className="card px-5 py-2">
        <div className="flex items-center justify-between py-3">
          <h2 className="font-semibold">Recent activity</h2>
          <Link to="/transactions" className="text-sm font-semibold text-brand-600">See all</Link>
        </div>
        {data.recent.length === 0 ? (
          <EmptyState title="No transactions yet" text="Deposit money to see your first entry here." action={<Link to="/deposit" className="text-sm font-semibold text-brand-600">Add money</Link>} />
        ) : data.recent.map((txn) => <TxnRow key={txn.id} txn={txn} hidden={hidden} />)}
      </section>
    </div>
  );
}
