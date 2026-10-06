export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function formatINR(value, hidden = false) {
  if (hidden) return "₹ ••••••";
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDay(value) {
  if (!value) return "";
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isoDate(date) {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
}

export function maskAccount(number) {
  if (!number) return "";
  return `•••• ${String(number).slice(-4)}`;
}

export function initials(name) {
  if (!name) return "CB";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function firstName(name) {
  return name ? name.split(" ")[0] : "";
}

export function greeting(name) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who = firstName(name);
  return who ? `${hello}, ${who}` : hello;
}

export function accountTitle(account) {
  if (!account) return "Account";
  return account.accountType === "CURRENT" ? "Current account" : "Savings account";
}

export const TYPE_LABELS = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  TRANSFER_IN: "Money in",
  TRANSFER_OUT: "Transfer",
  BILL_PAYMENT: "Bill payment",
  MOBILE_RECHARGE: "Recharge",
};
