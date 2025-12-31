"use client"

import { motion } from "framer-motion"

interface CircularGaugeProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  suffix?: string
}

export function CircularGauge({
  value,
  max,
  size = 80,
  strokeWidth = 8,
  color = "#064e3b",
  label,
  suffix = "",
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Cercle de progression */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Valeur centrale */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-[#000000]">{value}</span>
          {suffix && (
            <span className="text-xs text-[#4b5563]">{suffix}</span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-[#4b5563] text-center max-w-[80px]">
          {label}
        </span>
      )}
    </div>
  )
}

