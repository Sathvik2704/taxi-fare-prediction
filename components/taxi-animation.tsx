"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function TaxiAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative w-full max-w-xs h-24 mb-4">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.g
            animate={{
              x: [0, 10, 0],
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          >
            {/* Taxi body */}
            <rect x="20" y="25" width="80" height="25" rx="5" fill="#F59E0B" />
            <rect x="10" y="35" width="100" height="15" rx="3" fill="#F59E0B" />

            {/* Windows */}
            <rect x="30" y="28" width="15" height="12" rx="2" fill="#E5E7EB" />
            <rect x="55" y="28" width="15" height="12" rx="2" fill="#E5E7EB" />
            <rect x="80" y="28" width="15" height="12" rx="2" fill="#E5E7EB" />

            {/* Wheels */}
            <motion.circle
              cx="30"
              cy="50"
              r="8"
              fill="#1F2937"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.circle
              cx="90"
              cy="50"
              r="8"
              fill="#1F2937"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            {/* Taxi sign */}
            <rect x="50" y="20" width="20" height="8" rx="2" fill="#FBBF24" />
            <text x="55" y="27" fontSize="6" fill="#000000" fontWeight="bold">
              TAXI
            </text>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  )
}
