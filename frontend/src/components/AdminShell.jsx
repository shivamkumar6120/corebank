import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, List, LogOut, Menu, Shield, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn, initials } from "../lib/format";
import Logo from "./Logo";
import NavHighlight from "./NavHighlight";
import PageFade from "./PageFade";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/transactions", label: "Transactions", icon: List },
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

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
        <p className="mx-2 mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
          <Shield size={12} /> Admin
        </p>
        <nav className="mt-4 flex-1 space-y-1">
          {NAV.map((item) => (
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
                  <NavHighlight active={isActive} layoutId="admin-nav" />
                  <item.icon size={18} className="relative" />
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-semibold">{initials(user?.fullName)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user?.fullName}</span>
              <span className="block truncate text-xs text-slate-400">{user?.email}</span>
            </span>
          </div>
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-8">
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <p className="text-sm font-medium text-muted">Oversight</p>
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
