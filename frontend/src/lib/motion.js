import { useReducedMotion } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1];

export const PAGE_TRANSITION = { duration: 0.28, ease: EASE };

export function useMotionSafe() {
  return useReducedMotion();
}

export function riseVariants(reduce) {
  if (reduce) {
    return {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0, transition: { duration: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  };
}

export function staggerVariants(reduce, delayChildren = 0) {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.07,
        delayChildren: reduce ? 0 : delayChildren,
      },
    },
  };
}
