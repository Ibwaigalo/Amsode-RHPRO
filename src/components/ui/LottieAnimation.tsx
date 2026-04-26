"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LottieProps {
  type?: "success" | "loading" | "error" | "confetti" | "empty";
  size?: number;
  className?: string;
  loop?: boolean;
  show?: boolean;
}

export function LottieAnimation({ type = "success", size = 100, className, loop = true, show = true }: LottieProps) {
  const colors = {
    success: "#0090D1",
    loading: "#0090D1",
    error: "#DC2626",
    confetti: "#F59E0B",
    empty: "#6B7280",
  };

  const color = colors[type];

  if (!show) return null;

  return (
    <div
      className={className}
      style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {type === "success" && (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke={color}
            strokeWidth="6"
            fill="none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
          <motion.path
            d="M30 50 L45 65 L70 35"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          />
        </svg>
      )}

      {type === "loading" && (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="35"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={loop ? { repeat: Infinity, duration: 1.5, ease: "linear" } : { duration: 0 }}
            style={{ originX: "50%", originY: "50%" }}
          />
        </svg>
      )}

      {type === "error" && (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke={color}
            strokeWidth="6"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
          <motion.line
            x1="35"
            y1="35"
            x2="65"
            y2="65"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2 }}
          />
          <motion.line
            x1="65"
            y1="35"
            x2="35"
            y2="65"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3 }}
          />
        </svg>
      )}

      <AnimatePresence>
        {type === "confetti" && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: size }}
          >
            🎉
          </motion.div>
        )}
      </AnimatePresence>

      {type === "empty" && (
        <svg width={size} height={size} viewBox="0 0 100 100">
          <motion.rect
            x="20"
            y="35"
            width="60"
            height="40"
            rx="8"
            stroke={color}
            strokeWidth="4"
            fill="none"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0.3 }}
          />
          <motion.circle
            cx="50"
            cy="20"
            r="15"
            stroke={color}
            strokeWidth="4"
            fill="none"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0.3 }}
          />
        </svg>
      )}
    </div>
  );
}