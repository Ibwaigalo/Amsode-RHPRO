"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 1, prefix = "", suffix = "" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { duration: duration * 1000 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  
  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
    return unsubscribe;
  }, [spring]);

  const formatted = new Intl.NumberFormat("fr-ML").format(displayValue);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}

export function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const spring = useSpring(0, { bounce: 0, duration });
  const display = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}