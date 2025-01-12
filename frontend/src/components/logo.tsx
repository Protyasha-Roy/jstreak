'use client'

import { motion } from 'framer-motion'

export function Logo({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Background Circle */}
      <motion.circle
        cx="20"
        cy="20"
        r="18"
        className="stroke-primary"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* Pen tip */}
      <motion.path
        d="M14 26L18 22L26 14L22 18L14 26Z"
        className="fill-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Streak lines */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <path d="M24 12L28 16" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 10L30 14" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Dot */}
      <motion.circle
        cx="14"
        cy="26"
        r="2"
        className="fill-primary"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      />
    </motion.svg>
  )
}
