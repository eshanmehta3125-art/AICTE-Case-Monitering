import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { formatNumber } from "@/services/analytics";

/** Adapted Number Ticker pattern: spring from the actual prior count, never a decorative timer. */
export function NumberTicker({ value, label }: { value: number; label: string }) {
  const reduceMotion = useReducedMotion();
  const valueMotion = useMotionValue(value);
  const spring = useSpring(valueMotion, { damping: 28, stiffness: 135, mass: 0.85 });
  const formatted = useTransform(spring, (current) => formatNumber(Math.round(current)));
  useEffect(() => { valueMotion.set(value); }, [valueMotion, value]);
  if (reduceMotion) return <span className="number-ticker reduced" aria-label={`${label}: ${formatNumber(value)}`}>{formatNumber(value)}</span>;
  return <motion.span className="number-ticker" aria-label={`${label}: ${formatNumber(value)}`}>{formatted}</motion.span>;
}
