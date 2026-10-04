export default function Logo({ light = false, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill={light ? "#2F6BFF" : "#1F56E8"} />
        <path d="M21 9.1a7.4 7.4 0 1 0 0 13.8" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className={light ? "font-semibold tracking-tight text-white" : "font-semibold tracking-tight text-ink"}>CoreBank</div>
          <div className={light ? "text-[11px] uppercase tracking-[0.14em] text-slate-300" : "text-[11px] uppercase tracking-[0.14em] text-muted"}>
            Digital banking
          </div>
        </div>
      )}
    </div>
  );
}
