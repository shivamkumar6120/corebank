import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  FileText,
  Landmark,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Receipt,
  UserRound,
  Users,
  X,
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { cn, initials } from "../lib/format";
import Logo from "./Logo";
import NavHighlight from "./NavHighlight";
import PageFade from "./PageFade";

const NAV = [
  {
    section: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/accounts", label: "Accounts", icon: Landmark },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    section: "Payments",
    items: [
      { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
      { to: "/deposit", label: "Deposit", icon: ArrowDownToLine },
      { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
      { to: "/bills", label: "Bills & recharge", icon: Receipt },
    ],
  },
  {
    section: "Records",
    items: [
      { to: "/transactions", label: "Transactions", icon: List },
      { to: "/statements", label: "Statements", icon: FileText },
      { to: "/beneficiaries", label: "Beneficiaries", icon: Users },
    ],
  },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api.get("/notifications/unread-count")
      .then((response) => setUnread(response.data.count || 0))
      .catch(() => {});
  }, [location.pathname]);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-ice">
      {open && <button className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-navy-950 px-4 py-5 text-white transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between px-2">
          <Logo light />
          <button className="rounded-lg p-1 text-slate-300 lg:hidden" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto pb-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.section}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => cn(
                      "relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                      isActive ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <NavHighlight active={isActive} layoutId="customer-nav" />
                        <item.icon size={18} className="relative" />
                        <span className="relative flex-1">{item.label}</span>
                        {item.to === "/notifications" && unread > 0 && (
                          <span className="relative rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">{unread}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-semibold">{initials(user?.fullName)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user?.fullName}</span>
              <span className="block truncate text-xs text-slate-400">{user?.email}</span>
            </span>
          </button>
          <button
            onClick={logout}
            className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/85 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <p className="text-sm font-medium text-muted">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/notifications")} className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white hover:bg-slate-50" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />}
            </button>
            <button onClick={() => navigate("/profile")} className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-xs font-semibold text-white" aria-label="Profile">
              <UserRound size={16} className="sm:hidden" />
              <span className="hidden sm:inline">{initials(user?.fullName)}</span>
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <PageFade>
            <Outlet />
          </PageFade>
        </main>
      </div>
    </div>
  );
}
