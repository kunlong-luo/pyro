"use client";

import { motion } from "framer-motion";

export interface LoaderProps {
  status?: string;
}

export function Loader({ status = "正在装配烟花" }: LoaderProps) {
  return (
    <div className="loading-init">
      <motion.div
        className="loading-init__spinner"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="var(--text-faint)" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="var(--text-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 45"
          />
        </svg>
      </motion.div>
      <motion.div
        className="loading-init__header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        加载中
      </motion.div>
      <motion.div
        className="loading-init__status"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 0.4 }}
      >
        {status}
      </motion.div>
    </div>
  );
}
