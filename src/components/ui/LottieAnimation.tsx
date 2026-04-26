"use client";

import { motion } from "framer-motion";

interface LottieProps {
  type?: "success" | "loading" | "error" | "confetti";
  size?: number;
  className?: string;
  loop?: boolean;
}

const animations = {
  success: {
    circle: { scale: [0, 1, 1, 1], opacity: [0, 1] },
    check: { pathLength: [0, 1], opacity: [0, 1, 1] },
  },
  loading: {
    rotate: [0, 360],
    scale: [1, 1.1, 1],
  },
  error: {
    circle: { scale: [0, 1, 1, 1], opacity: [0, 1] },
    x: { pathLength: [0, 1], opacity: [0, 1, 1] },
  },
};

export function LottieAnimation({ type = "success", size = 100, className, loop = true }: LottieProps) {
  const colors = {
    success: "#0090D1",
    loading: "#0090D1", 
    error: "#DC2626",
    confetti: "#F59E0B",
  };

  const color = colors[type];
  const isLooping = type === "loading" ? loop : false;

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
      animate={animations[type]?.circle || { rotate: 360 }}
      transition={isLooping ? { repeat: Infinity, duration: 2, ease: "linear" } : { duration: 0.5 }}
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
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            style={{ originX: 0.5, originY: 0.5 }}
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

      {type === "confetti" && (
        <motion.div
          style={{ fontSize: size }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          🎉
        </motion.div>
      )}
    </motion.div>
  );
}

export function LottieInView(props: LottieProps) {
  return <LottieAnimation {...props} />;
}