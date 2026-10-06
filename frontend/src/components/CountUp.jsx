import { useEffect, useRef, useState } from "react";
import { formatINR } from "../lib/format";
import { useMotionSafe } from "../lib/motion";

export default function CountUp({ value, hidden = false }) {
  const reduce = useMotionSafe();
  const target = Number(value ?? 0);
  const played = useRef(false);
  const [shown, setShown] = useState(() => (reduce ? target : 0));

  useEffect(() => {
    if (hidden || reduce || played.current || !Number.isFinite(target)) {
      setShown(target);
      if (!hidden && Number.isFinite(target)) played.current = true;
      return undefined;
    }
    played.current = true;
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 600);
      const eased = 1 - (1 - progress) ** 3;
      setShown(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, hidden, reduce]);

  return formatINR(hidden ? value : shown, hidden);
}
