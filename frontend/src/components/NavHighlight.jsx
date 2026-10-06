import { motion } from "framer-motion";
import { EASE, useMotionSafe } from "../lib/motion";

export default function NavHighlight({ active, layoutId }) {
  const reduce = useMotionSafe();
  if (!active) return null;
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 rounded-xl bg-white/10"
      transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE }}
    />
  );
}
