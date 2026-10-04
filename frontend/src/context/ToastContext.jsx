import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "../lib/format";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, tone = "success") => setToast({ message, tone, id: Date.now() });

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-[80] max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lift",
            toast.tone === "error" ? "bg-rose-600 text-white" : "bg-navy-900 text-white"
          )}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
