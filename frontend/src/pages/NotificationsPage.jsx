import { useEffect, useState } from "react";
import { Bell, CircleCheck, Info, TriangleAlert } from "lucide-react";
import api from "../api/client";
import { Button, EmptyState, PageHeader } from "../components/ui";
import { cn, formatDate } from "../lib/format";

const icons = {
  SUCCESS: CircleCheck,
  ALERT: TriangleAlert,
  INFO: Info,
};

export default function NotificationsPage() {
  const [items, setItems] = useState(null);

  const load = () => api.get("/notifications").then((response) => setItems(response.data));
  useEffect(() => { load(); }, []);

  const mark = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Credits, payments, and security notes from your accounts."
        action={<Button variant="secondary" onClick={markAll}>Mark all read</Button>}
      />
      <div className="card divide-y divide-line">
        {!items || items.length === 0 ? (
          <EmptyState icon={<Bell size={20} />} title="You're all caught up" text="New transfers and alerts will show up here." />
        ) : items.map((item) => {
          const Icon = icons[item.type] || Info;
          return (
            <button key={item.id} onClick={() => !item.read && mark(item.id)} className={cn("flex w-full gap-4 px-5 py-4 text-left", item.read ? "bg-white" : "bg-brand-50/60")}>
              <span className={cn("mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full", item.type === "ALERT" ? "bg-amber-50 text-amber-600" : item.type === "SUCCESS" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-navy-800")}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{item.title}</span>
                  {!item.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                </span>
                <span className="mt-1 block text-sm text-muted">{item.message}</span>
                <span className="mt-1 block text-xs text-muted">{formatDate(item.createdAt)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
