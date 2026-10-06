import { motion } from "framer-motion";
import { EASE, useMotionSafe } from "../lib/motion";

export default function MotionRow({ index = 0, className, children }) {
  const reduce = useMotionSafe();
  return (
    <motion.tr
      className={className}
      style={{ display: "table-row" }}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.28,
        delay: reduce ? 0 : Math.min(index, 12) * 0.04,
        ease: EASE,
      }}
    >
      {children}
    </motion.tr>
  );
}
