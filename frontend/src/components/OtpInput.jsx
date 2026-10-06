import { useRef } from "react";

export default function OtpInput({ value, onChange, onComplete }) {
  const inputs = useRef([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const commit = (next) => {
    const cleaned = next.replace(/\D/g, "").slice(0, 6);
    onChange(cleaned);
    if (cleaned.length === 6) onComplete?.(cleaned);
  };

  const setAt = (index, char) => {
    const chars = value.split("");
    chars[index] = char;
    commit(chars.join("").replace(/\s/g, ""));
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { inputs.current[index] = node; }}
          className="h-14 w-full rounded-xl border border-line bg-white text-center text-xl font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={6}
          value={digit.trim()}
          onChange={(event) => {
            const raw = event.target.value.replace(/\D/g, "");
            if (raw.length > 1) {
              commit(raw);
              inputs.current[Math.min(raw.length, 5)]?.focus();
              return;
            }
            setAt(index, raw);
            if (raw && inputs.current[index + 1]) inputs.current[index + 1].focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index].trim() && inputs.current[index - 1]) {
              inputs.current[index - 1].focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            commit(pasted);
            inputs.current[Math.min(pasted.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
