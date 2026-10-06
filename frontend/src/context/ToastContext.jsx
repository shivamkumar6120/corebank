import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/format";
import { EASE, useMotionSafe } from "../lib/motion";

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
      <ToastBanner toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastBanner({ toast }) {
  const reduce = useMotionSafe();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: reduce ? 0.12 : 0.28, ease: EASE }}
          className={cn(
            "fixed bottom-5 right-5 z-[80] max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lift",
            toast.tone === "error" ? "bg-rose-600 text-white" : "bg-navy-900 text-white"
          )}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
