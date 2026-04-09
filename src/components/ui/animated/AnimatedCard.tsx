"use client";

import { motion } from "framer-motion";
import { HTMLAttributes, forwardRef } from "react";

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  press?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className = "", hover = true, press = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
        whileTap={press ? { scale: 0.99, transition: { duration: 0.1 } } : undefined}
        className={`
          bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5
          shadow-sm hover:shadow-md transition-shadow
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-full bg-[#0090D1]/10 flex items-center justify-center text-[#0090D1]">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}