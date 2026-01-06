"use client"

import { motion } from "framer-motion"

interface CourseHealthGaugeProps {
  operationalPercentage: number
  operationalHoles: number
  totalHoles: number
}

export function CourseHealthGauge({
  operationalPercentage,
  operationalHoles,
  totalHoles,
}: CourseHealthGaugeProps) {
  const circumference = 2 * Math.PI * 45 // radius = 45
  const offset = circumference - (operationalPercentage / 100) * circumference

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-200"
          />
          {/* Progress circle */}
          <motion.circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className="text-emerald-600"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{operationalPercentage}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">Opérationnel</p>
        <p className="text-xl font-bold text-slate-900">
          {operationalHoles}/{totalHoles} trous conformes
        </p>
      </div>
    </div>
  )
}

