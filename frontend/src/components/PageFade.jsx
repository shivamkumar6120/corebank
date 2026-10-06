import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { EASE, useMotionSafe } from "../lib/motion";

export default function PageFade({ children, slide = 10 }) {
  const location = useLocation();
  const reduce = useMotionSafe();
  return (
    <motion.div
      key={location.pathname}
      initial={reduce ? false : { opacity: 0, y: slide }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
